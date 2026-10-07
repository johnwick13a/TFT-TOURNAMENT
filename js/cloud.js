import {
    TOURNAMENT_CONFIG
} from "../data/config.js";

const TOURNAMENT_ROW_ID = "main";
const SHARING_ENABLED_KEY = "tft-tournament-sharing-enabled-v1";

let supabaseClientPromise;
let activeChannel;
let publishQueue = Promise.resolve();

async function getSupabaseClient() {

    if (
        !TOURNAMENT_CONFIG.supabaseUrl
        || !TOURNAMENT_CONFIG.supabaseAnonKey
    ) {
        throw new Error(
            "Chưa cấu hình Supabase URL và anon key trong data/config.js."
        );
    }

    if (!supabaseClientPromise) {
        supabaseClientPromise =
            import("https://esm.sh/@supabase/supabase-js@2")
                .then(({ createClient }) => {
                    return createClient(
                        TOURNAMENT_CONFIG.supabaseUrl,
                        TOURNAMENT_CONFIG.supabaseAnonKey
                    );
                })
                .catch(error => {
                    supabaseClientPromise = null;
                    throw new Error(
                        `Không tải được thư viện Supabase: ${error.message}`
                    );
                });
    }

    return supabaseClientPromise;

}


function getSupabaseLoginEmail(username) {

    const login = username.trim().toLowerCase();

    if (login.includes("@")) {
        return login;
    }

    if (!/^[a-z0-9._-]+$/.test(login)) {
        throw new Error("Tên đăng nhập chỉ được có chữ, số, dấu chấm, gạch dưới hoặc gạch ngang.");
    }

    const projectHost =
        new URL(TOURNAMENT_CONFIG.supabaseUrl).hostname;

    return `${login}@${projectHost}`;

}


export async function signInCloudUser(username, password) {

    const client = await getSupabaseClient();
    const { data, error } =
        await client.auth.signInWithPassword({
            email: getSupabaseLoginEmail(username),
            password
        });

    if (error) {
        throw error;
    }

    return data.user;

}


export async function signOutCloudUser() {

    const client = await getSupabaseClient();
    const { error } =
        await client.auth.signOut();

    if (error) {
        throw error;
    }

}


export async function getCloudUser() {

    const client = await getSupabaseClient();
    const { data, error } =
        await client.auth.getSession();

    if (error) {
        throw error;
    }

    return data.session?.user || null;

}


export async function getSharedTournamentOwnerId() {

    const client = await getSupabaseClient();
    const { data, error } =
        await client
            .from("tournaments")
            .select("owner_id")
            .eq("id", TOURNAMENT_ROW_ID)
            .maybeSingle();

    if (error) {
        throw error;
    }

    return data?.owner_id || null;

}


export function publishTournament(data) {

    const request =
        publishQueue.then(
            () => publishTournamentNow(data),
            () => publishTournamentNow(data)
        );

    publishQueue =
        request.catch(() => {});

    return request;

}


async function publishTournamentNow(data) {

    const client = await getSupabaseClient();
    const { data: authData, error: authError } =
        await client.auth.getUser();

    if (authError) {
        throw authError;
    }

    if (!authData.user) {
        throw new Error("Đăng nhập tài khoản quản lý trước khi đồng bộ.");
    }

    if (authData.user.app_metadata?.role !== "manager") {
        throw new Error("Tài khoản này không có quyền quản lý giải đấu.");
    }

    const { error } =
        await client
            .from("tournaments")
            .upsert(
                {
                    id: TOURNAMENT_ROW_ID,
                    owner_id: authData.user.id,
                    state: data,
                    updated_at: new Date().toISOString()
                },
                { onConflict: "id" }
            );

    if (error) {
        throw error;
    }

    window.localStorage.setItem(
        SHARING_ENABLED_KEY,
        "true"
    );

}


export async function deleteSharedTournament() {

    const client = await getSupabaseClient();
    const { data: authData, error: authError } =
        await client.auth.getUser();

    if (authError) {
        throw authError;
    }

    if (!authData.user) {
        throw new Error(
            "Đăng nhập tài khoản quản lý để ngừng phát BXH."
        );
    }

    if (authData.user.app_metadata?.role !== "manager") {
        throw new Error("Tài khoản này không có quyền quản lý giải đấu.");
    }

    const { error } =
        await client
            .from("tournaments")
            .delete()
            .eq("id", TOURNAMENT_ROW_ID);

    if (error) {
        throw error;
    }

    disableCloudSharing();

}


export function isCloudSharingEnabled() {

    return window.localStorage.getItem(
        SHARING_ENABLED_KEY
    ) === "true";

}


export function disableCloudSharing() {

    window.localStorage.removeItem(
        SHARING_ENABLED_KEY
    );

}


export function getSharedTournamentUrl() {

    const url =
        new URL("viewer.html", window.location.href);

    return url.toString();

}


export async function subscribeToTournament(onTournament, onStatus) {

    const client = await getSupabaseClient();

    if (activeChannel) {
        await client.removeChannel(activeChannel);
        activeChannel = null;
    }

    activeChannel =
        client
            .channel(`shared-tournament-${TOURNAMENT_ROW_ID}`)
            .on(
                "postgres_changes",
                {
                    event: "*",
                    schema: "public",
                    table: "tournaments",
                    filter: `id=eq.${TOURNAMENT_ROW_ID}`
                },
                payload => {
                    if (payload.new?.state) {
                        onTournament(payload.new.state);
                    } else if (payload.eventType === "DELETE") {
                        onTournament(null);
                    }
                }
            )
            .subscribe(status => {
                onStatus(status);
            });

    const { data, error } =
        await client
            .from("tournaments")
            .select("state")
            .eq("id", TOURNAMENT_ROW_ID)
            .maybeSingle();

    if (error) {
        throw error;
    }

    if (data?.state) {
        onTournament(data.state);
    } else {
        onTournament(null);
    }

}


export async function unsubscribeFromTournament() {

    if (!activeChannel) {
        return;
    }

    const client = await getSupabaseClient();
    const result =
        await client.removeChannel(activeChannel);

    if (result !== "ok") {
        throw new Error(`Không thể ngắt kết nối BXH: ${result}`);
    }

    activeChannel = null;

}
