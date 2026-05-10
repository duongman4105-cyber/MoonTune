# Mini SoundCloud Project

Dự án nghe nhạc trực tuyến (MERN Stack).

## 1. Cài đặt Backend
Di chuyển vào thư mục server:
```bash
cd server
npm init -y
npm install express mongoose dotenv cors multer cloudinary
npm install --save-dev nodemon
```

### Cấu hình Cloudinary (Quan trọng)
1. Đăng ký tài khoản tại [Cloudinary.com](https://cloudinary.com/).
2. Vào Dashboard lấy `Cloud Name`, `API Key`, `API Secret`.
3. Tạo file `.env` trong thư mục `server` và điền thông tin thật (Ví dụ bên dưới):

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/mini-soundcloud

# Thay thế các giá trị bên dưới bằng thông tin thật của bạn
CLOUDINARY_CLOUD_NAME=ten_cloud_cua_ban
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=abcdefghijklmnopqrstuvwxyz
```

*Lưu ý: Sau khi sửa file .env, phải tắt server và chạy lại mới nhận cấu hình.*

## 2. Cài đặt Frontend
Di chuyển vào thư mục client:
```bash
cd client
npx create-react-app .
npm install axios react-router-dom react-icons react-h5-audio-player wavesurfer.js
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

## 3. Cấu trúc thư mục
- /client: ReactJS App
- /server: NodeJS API

## 4. Cách chạy
- Terminal 1 (Server): `cd server && npm run dev` (hoặc `node index.js`)
- Terminal 2 (Client): `cd client && npm run dev
`

## 5. Hướng dẫn Deploy (Miễn phí)

### Bước 1: Database (MongoDB Atlas)
1. Tạo tài khoản tại [MongoDB Atlas](https://www.mongodb.com/atlas/database).
2. Tạo Cluster mới (Free Shared).
3. **Nhấn nút "Connect"** (nút màu trắng cạnh nút "View Monitoring" như trong hình).
4. Một bảng hiện ra, làm theo các bước:
   - **Add a connection IP address**: Chọn "Allow Access from Anywhere" (0.0.0.0/0) rồi nhấn "Add IP Address".
   - **Create a Database User**: Điền Username và Password (ví dụ: `admin` / `123456`), nhấn "Create Database User". **(Nhớ kỹ mật khẩu này)**.
   - Nhấn nút **"Choose a connection method"**.
5. Chọn **Drivers** (Node.js).
6. Copy chuỗi kết nối bên dưới mục "Add your connection string into your application code".
   - Chuỗi có dạng: `mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/...`
   - *Lưu ý quan trọng: Khi dùng chuỗi này, hãy thay chữ `<password>` bằng mật khẩu bạn vừa tạo ở trên.*

### Bước 2: Backend (Render.com)
1. Đẩy toàn bộ code lên GitHub.
2. Tạo tài khoản Render, chọn **New Web Service**, kết nối với repo GitHub.
3. Cấu hình:
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
4. Vào phần **Environment Variables**, thêm các biến giống file `.env`:
   - `MONGO_URI`: (Link lấy từ Bước 1)
   - `CLOUDINARY_CLOUD_NAME`: ...
   - `CLOUDINARY_API_KEY`: ...
   - `CLOUDINARY_API_SECRET`: ...

### Bước 3: Frontend (Vercel)
1. Trong code React (`client`), tìm chỗ gọi API (ví dụ `http://localhost:5000`) và đổi thành link Backend vừa deploy trên Render (ví dụ `https://my-app.onrender.com`).
2. Commit và push code mới lên GitHub.
3. Tạo tài khoản Vercel, chọn **Add New Project**, kết nối repo.
4. Cấu hình:
   - **Root Directory**: `client`
   - **Framework Preset**: Create React App
5. Nhấn **Deploy**.

### (Tùy chọn) Deploy Frontend lên GitHub Pages
*Lưu ý: GitHub Pages chỉ chứa Frontend. Backend vẫn phải deploy ở Render (Bước 2).*

1. Trong thư mục `client`, cài đặt `gh-pages`:
   ```bash
   npm install gh-pages --save-dev
   ```
2. Mở file `client/package.json`, thêm dòng `homepage`:
   ```json
   "homepage": "https://<username-github>.github.io/<ten-repo>",
   ```
3. Thêm script vào `client/package.json`:
   ```json
   "scripts": {
     "predeploy": "npm run build",
     "deploy": "gh-pages -d build",
     // ...các script khác
   }
   ```
4. Chạy lệnh deploy:
   ```bash
   npm run deploy
   ```

## 6. Mẹo: Xử lý API URL khi Deploy
Để code chạy đúng cả trên Localhost và khi Deploy mà không cần sửa đi sửa lại:

1. Trong thư mục `client`, tạo file `.env` (nếu chưa có):
   ```env
   REACT_APP_API_URL=http://localhost:5000
   ```

2. Trong code React (nơi gọi API), thay thế đường dẫn cứng bằng biến môi trường:
   ```javascript
   // Thay vì dùng: axios.get('http://localhost:5000/api/songs')
   // Hãy dùng:
   const API_URL = process.env.REACT_APP_API_URL;
   axios.get(`${API_URL}/api/songs`);
   ```

3. Khi deploy lên **Vercel** (Frontend):
   - Vào **Settings** > **Environment Variables**.
   - Thêm Key: `REACT_APP_API_URL`.
   - Thêm Value: Link Backend trên Render (`https://my-app.onrender.com`).