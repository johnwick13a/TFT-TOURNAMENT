# Thiết lập BXH trực tuyến

Ứng dụng vẫn chạy cục bộ nếu chưa cấu hình Supabase. Để phát BXH trực tiếp cho bạn bè:

1. Tạo một dự án Supabase. Tắt đăng ký công khai; tạo tài khoản trong **Authentication → Users** với email dạng `<username>@<hostname-dự-án>`. Hostname nằm trong Project URL, ví dụ với `https://abc123.supabase.co` thì user `phuoc` dùng `phuoc@abc123.supabase.co`, user `admin` dùng `admin@abc123.supabase.co`. Bật xác nhận thủ công/đánh dấu email đã xác nhận vì đây là email đăng nhập bí danh, không phải hộp thư nhận thư. Không chia sẻ tài khoản quản lý.
2. Mở **SQL Editor** trong Supabase, chạy toàn bộ `supabase/schema.sql`.
3. Cấp vai trò manager cho tài khoản quản lý (thay email bằng email thật) trong **SQL Editor**:
   ```sql
   update auth.users
   set raw_app_meta_data =
       coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role":"manager"}'::jsonb
   where email = 'phuoc@sjuptprkxazqwskgooyu.supabase.co';
   ```
   Thay hostname trong email nếu Project URL của bạn khác ví dụ. Đăng xuất rồi đăng nhập lại sau khi đổi vai trò để nhận access token mới. Tài khoản `admin` chỉ cần user Supabase thông thường, không có `role=manager`.
4. Mở **Project Settings → API** và chép Project URL cùng public anon key vào `supabaseUrl` và `supabaseAnonKey` trong `data/config.js`.
5. Đưa toàn bộ mã nguồn lên GitHub, giữ nguyên các thư mục `css`, `data`, `js`, `assets`, `supabase` và hai trang `manager.html`, `viewer.html`. Trong **Settings → Pages**, chọn **Deploy from a branch**, nhánh `main`, thư mục `/(root)`, rồi **Save**. Không mở trang bằng `file://`.
6. Mở trang chính và đăng nhập bằng username `phuoc` hoặc tài khoản quản lý; ứng dụng tự nhận diện quyền để mở giao diện quản lý. Tạo giải rồi bấm **Bật BXH trực tiếp**.
7. Bấm **Sao chép link xem BXH** và gửi link `viewer.html` cùng username `admin` và mật khẩu riêng cho bạn bè. Sau khi đăng nhập, tài khoản xem sẽ tự vào giao diện chỉ đọc gồm bảng hạng/điểm và các ô Top theo từng vòng; dữ liệu cập nhật trực tiếp.

Chỉ dùng public anon key ở frontend. **Không bao giờ** đưa `service_role` key vào `data/config.js` hoặc bất kỳ file nào được host công khai. Quyền đọc yêu cầu đăng nhập. Quyền ghi được giới hạn bởi RLS trong `supabase/schema.sql` cho user có metadata `role=manager` và sở hữu giải đấu. Sau khi sửa quyền trong schema, chạy lại toàn bộ `supabase/schema.sql` trong Supabase SQL Editor để áp dụng thay đổi.

Hiện tại mỗi dự án Supabase lưu một BXH dùng chung. Nút reset sẽ dừng chia sẻ và xóa dữ liệu trực tuyến cùng dữ liệu trên máy quản lý.

## Deploy lần đầu bằng GitHub

1. Tạo repository mới trên GitHub (có thể để **Public**; anon key trong ứng dụng là public key, không phải secret).
2. Đưa các file trong thư mục dự án lên repository, giữ nguyên cấu trúc thư mục. Cần có `index.html`, `manager.html`, `viewer.html` và các thư mục `css`, `data`, `js`, `assets`, `supabase`.
3. Vào **Settings → Pages**. Nếu đã tải `.github/workflows/deploy.yml` lên, chọn **GitHub Actions** ở mục Build and deployment. Nếu tải file bằng giao diện web mà không có workflow, chọn **Deploy from a branch**, nhánh `main`, thư mục `/(root)`.
4. Trang sẽ có URL dạng `https://<tên-tài-khoản>.github.io/<tên-repository>/`. Mở URL này để kiểm tra; các lần cập nhật mã nguồn trên `main` sẽ tự deploy lại.
