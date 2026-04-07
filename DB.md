# DB.md

## Mục tiêu

Tài liệu này mô tả cách làm việc với SQLite trong starter Tauri hiện tại.

Repo này đang dùng:

- Tauri 2
- `tauri-plugin-sql` với driver `sqlite`
- Frontend gọi DB qua `@tauri-apps/plugin-sql`
- Migration được đăng ký ở Rust khi app khởi động

Mục tiêu thực tế:

- Có local database để lưu dữ liệu desktop app
- Viết query rõ ràng, typed, dễ bảo trì
- Không để component UI tự viết SQL lung tung
- Giữ schema thay đổi có kiểm soát bằng migrations

---

## Trạng thái hiện tại trong repo

Các file quan trọng:

- `src-tauri/src/lib.rs`
  Nơi đăng ký plugin SQL và migrations.

- `src-tauri/migrations/0001_create_todos.sql`
  Migration đầu tiên, tạo bảng `todos`.

- `src-tauri/tauri.conf.json`
  Cấu hình preload connection cho plugin SQL.

- `src-tauri/capabilities/default.json`
  Quyền truy cập SQL của app.

- `src/lib/db/client.ts`
  Chỗ load SQLite connection.

- `src/lib/db/todos.ts`
  Data layer mẫu cho bảng `todos`.

- `src/routes/todos.tsx`
  UI demo CRUD thật với SQLite.

Connection string hiện tại:

```ts
sqlite:todo.db
```

`todo.db` không nằm trong root repo. Đây là tên file DB được plugin SQL resolve vào thư mục app config của ứng dụng.

---

## File DB tạo ra nằm ở đâu

Với connection string:

```ts
sqlite:todo.db
```

plugin SQL của Tauri sẽ resolve path relative theo thư mục app config của ứng dụng, không theo source code, không theo `src-tauri`, và không theo root repo.

### Khi dev

Khi chạy:

```powershell
corepack pnpm dev:app
```

file DB vẫn nằm trong thư mục app config của app trên máy đang chạy.

Nó không nằm trong repo.

Trên Windows, thường nó sẽ nằm theo hướng:

```text
%APPDATA%/<identifier hoặc product name>/todo.db
```

Với starter hiện tại, giá trị liên quan là:

- `productName`: `Tauri Starter`
- `identifier`: `com.example.tauri-starter`

Nên khi dev trên Windows, mày nên expect file DB nằm quanh khu vực:

```text
C:\Users\<user>\AppData\Roaming\com.example.tauri-starter\todo.db
```

hoặc:

```text
C:\Users\<user>\AppData\Roaming\Tauri Starter\todo.db
```

Đường dẫn cụ thể có thể khác nhau tùy cách Tauri resolve tên app trên từng nền tảng, nhưng nguyên tắc là:

- nằm trong app config directory của ứng dụng
- không nằm trong repo

### Khi distribute

Khi build và cài app, file DB cũng sẽ nằm trong app config directory của ứng dụng đã cài trên máy người dùng.

Nó vẫn không nằm trong thư mục cài đặt executable.
Nó vẫn không nằm cạnh file `.exe`.
Nó vẫn không nằm trong `dist`.

Lý do:

- thư mục cài đặt thường không phù hợp để ghi dữ liệu app
- dữ liệu local cần tách khỏi binaries
- update app không nên đè lên data file

Tóm lại:

- Khi dev: DB nằm trong app config dir của app dev
- Khi distribute: DB nằm trong app config dir của app đã cài
- Cả hai trường hợp: DB không nằm trong repo, không nằm trong `src-tauri`, không nằm trong `dist`

### Cách tự check vị trí DB trên máy

1. Chạy app
2. Tạo 1 todo trong `/todos`
3. Tìm file `todo.db` trong thư mục app data của hệ điều hành

Trên Windows có thể tìm nhanh bằng PowerShell:

```powershell
Get-ChildItem $env:APPDATA -Recurse -Filter todo.db -ErrorAction SilentlyContinue
```

Nếu sau này cần kiểm soát vị trí DB rõ hơn, có thể đổi connection string sang path cụ thể hơn thay vì chỉ `sqlite:todo.db`.

---

## Cách SQLite đang được nối vào app

### 1. Cài dependency

Frontend:

```powershell
corepack pnpm add @tauri-apps/plugin-sql
```

Rust:

```powershell
cd src-tauri
cargo add tauri-plugin-sql --features sqlite
```

### 2. Khởi tạo plugin ở Rust

Trong `src-tauri/src/lib.rs`:

```rust
.plugin(
    tauri_plugin_sql::Builder::default()
        .add_migrations("sqlite:todo.db", migrations)
        .build(),
)
```

Điểm quan trọng:

- Chuỗi `"sqlite:todo.db"` phải thống nhất giữa Rust và frontend
- Migration được gắn theo connection string này

### 3. Khai báo preload trong Tauri config

Trong `src-tauri/tauri.conf.json`:

```json
"plugins": {
  "sql": {
    "preload": ["sqlite:todo.db"]
  }
}
```

Ý nghĩa:

- Khi app start, connection này có thể được preload
- Migration của connection này cũng sẽ được áp dụng ngay khi plugin init hoặc khi `load()` được gọi

### 4. Cấp quyền SQL

Trong `src-tauri/capabilities/default.json`:

```json
"sql:default",
"sql:allow-execute"
```

Giải thích:

- `sql:default` cho phép load, close, select
- `sql:allow-execute` cho phép các câu lệnh ghi như `INSERT`, `UPDATE`, `DELETE`

Nếu quên phần này, frontend có thể load được plugin nhưng query sẽ fail vì capability.

---

## Cách chạy và kiểm tra

Chạy app desktop:

```powershell
corepack pnpm dev:app
```

Build frontend:

```powershell
corepack pnpm build
```

Check Rust:

```powershell
cd src-tauri
cargo check
```

Page demo hiện tại:

- `/todos`

Flow kiểm tra nhanh:

1. Mở app
2. Vào `/todos`
3. Tạo todo mới
4. Toggle hoàn thành
5. Xoá todo
6. Restart app để xem dữ liệu còn giữ lại

---

## Cách viết query đúng trong starter này

### Nguyên tắc

- Không viết SQL trực tiếp trong route/component
- Tạo data module riêng trong `src/lib/db/`
- Route chỉ gọi các hàm như `listTodos()`, `createTodo()`, `toggleTodo()`
- Query phải dùng placeholder params, không nối string thủ công
- Tách `row type` và `domain type` nếu dữ liệu DB khác dữ liệu UI

### Mẫu đang dùng

Trong `src/lib/db/client.ts`:

```ts
import Database from "@tauri-apps/plugin-sql";

const TODO_DATABASE = "sqlite:todo.db";

let databasePromise: Promise<Database> | null = null;

export function getDatabase() {
  if (!databasePromise) {
    databasePromise = Database.load(TODO_DATABASE);
  }

  return databasePromise;
}
```

Ý nghĩa:

- Dùng lazy singleton cho DB connection
- Không gọi `Database.load(...)` lặp đi lặp lại ở mọi component

### Viết query đọc

Ví dụ:

```ts
type TodoRow = {
  id: number;
  title: string;
  completed: number;
  created_at: string;
};

const rows = await db.select<TodoRow[]>(
  "SELECT id, title, completed, created_at FROM todos ORDER BY id DESC",
);
```

Best practices:

- Chọn cột rõ ràng, không lạm dụng `SELECT *`
- Tạo `Row` type theo schema thật của DB
- Map từ row sang kiểu dùng trong UI

### Viết query ghi

Ví dụ:

```ts
await db.execute("INSERT INTO todos (title) VALUES (?)", [title.trim()]);
await db.execute("UPDATE todos SET completed = ? WHERE id = ?", [1, id]);
await db.execute("DELETE FROM todos WHERE id = ?", [id]);
```

Best practices:

- Luôn truyền params bằng mảng
- Không nối chuỗi SQL kiểu:

```ts
`DELETE FROM todos WHERE id = ${id}`
```

- Validate dữ liệu trước khi query

### Nên tổ chức data layer thế nào

Ví dụ mở rộng:

```text
src/lib/db/
  client.ts
  todos.ts
  projects.ts
  tags.ts
```

Trong đó:

- `client.ts`: giữ `Database.load(...)`
- `todos.ts`: query cho bảng todos
- `projects.ts`: query cho bảng projects

---

## Cách viết migration đúng

### Cách repo này đang làm

Migration SQL đặt ở:

- `src-tauri/migrations/0001_create_todos.sql`

Migration được đăng ký ở:

- `src-tauri/src/lib.rs`

```rust
let migrations = vec![Migration {
    version: 1,
    description: "create_todos_table",
    sql: include_str!("../migrations/0001_create_todos.sql"),
    kind: MigrationKind::Up,
}];
```

### Cách thêm migration mới

Ví dụ muốn thêm cột `notes` vào bảng `todos`.

1. Tạo file:

```text
src-tauri/migrations/0002_add_todo_notes.sql
```

2. Thêm SQL:

```sql
ALTER TABLE todos ADD COLUMN notes TEXT;
```

3. Đăng ký trong `src-tauri/src/lib.rs`:

```rust
Migration {
    version: 2,
    description: "add_todo_notes",
    sql: include_str!("../migrations/0002_add_todo_notes.sql"),
    kind: MigrationKind::Up,
}
```

4. Cập nhật TypeScript types và query.

### Rule bắt buộc cho migration

- `version` phải tăng dần, không trùng
- `description` phải ngắn, rõ nghĩa
- Không sửa nội dung migration cũ đã phát hành
- Muốn thay đổi schema tiếp thì tạo migration mới

---

## Checklist khi thêm feature mới có dùng SQLite

1. Viết migration SQL mới trong `src-tauri/migrations/`
2. Đăng ký migration trong `src-tauri/src/lib.rs`
3. Tạo hoặc cập nhật data module trong `src/lib/db/`
4. Định nghĩa row type và domain type
5. Viết query bằng placeholder params
6. Map dữ liệu DB sang shape dùng trong UI
7. Gọi data layer từ route/component
8. Chạy:

```powershell
corepack pnpm build
cd src-tauri
cargo check
```

---

## Kết luận

Cách làm ổn nhất cho starter này là:

- SQLite làm local persistence
- migration quản lý schema
- query gom trong data layer
- route/UI chỉ tiêu thụ hàm data layer

Baseline hiện tại của repo đã có ví dụ thật ở route `/todos`. Khi cần thêm feature mới, hãy copy đúng pattern đó trước rồi mới tinh chỉnh tiếp.
