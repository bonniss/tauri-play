# DB.md

## Mục tiêu

Tài liệu này mô tả cách làm việc với SQLite trong app Tauri hiện tại.

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

- `src/lib/todo-db.ts`
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

Đây là phần quan trọng nhất để tránh nhầm.

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

Với repo hiện tại, giá trị liên quan là:

- `productName`: `tauri-app`
- `identifier`: `com.user.tauri-app`

Nên khi dev trên Windows, mày nên expect file DB nằm quanh khu vực:

```text
C:\Users\<user>\AppData\Roaming\com.user.tauri-app\todo.db
```

hoặc:

```text
C:\Users\<user>\AppData\Roaming\tauri-app\todo.db
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

- thư mục cài đặt thường được xem là read-only hoặc không phù hợp để ghi dữ liệu app
- dữ liệu local cần tách khỏi binaries
- update app không nên đè lên data file

Tóm lại:

- Khi dev: DB nằm trong app config dir của app dev
- Khi distribute: DB nằm trong app config dir của app đã cài
- Cả hai trường hợp: DB không nằm trong repo, không nằm trong `src-tauri`, không nằm trong `dist`

### Cách tự check vị trí DB trên máy

Cách thực dụng nhất:

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

## Cách viết query đúng trong app này

### Nguyên tắc

- Không viết SQL trực tiếp trong route/component
- Tạo một data module riêng trong `src/lib/`
- Route chỉ gọi các hàm như `listTodos()`, `createTodo()`, `toggleTodo()`
- Query phải dùng placeholder params, không nối string thủ công
- Tách `row type` và `domain type` nếu dữ liệu DB khác dữ liệu UI

### Mẫu đang dùng

Trong `src/lib/todo-db.ts`:

```ts
import Database from "@tauri-apps/plugin-sql";

const TODO_DATABASE = "sqlite:todo.db";

let databasePromise: Promise<Database> | null = null;

function getDatabase() {
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

Ví dụ mapping:

```ts
function mapTodo(row: TodoRow) {
  return {
    id: row.id,
    title: row.title,
    completed: row.completed === 1,
    createdAt: row.created_at,
  };
}
```

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

- Validate dữ liệu trước khi query, ví dụ `trim()`, kiểm tra empty string

### Nên tổ chức data layer thế nào

Với mỗi feature:

- 1 file DB module cho feature nhỏ
- Hoặc 1 thư mục `src/lib/db/` nếu bắt đầu lớn

Ví dụ mở rộng:

```text
src/lib/db/
  database.ts
  todos.ts
  projects.ts
  tags.ts
```

Trong đó:

- `database.ts`: giữ `Database.load(...)`
- `todos.ts`: query cho bảng todos
- `projects.ts`: query cho bảng projects

---

## Cách viết migration đúng

### Migration là gì

Migration là cách thay đổi schema DB có version rõ ràng theo thời gian.

Không sửa schema bằng tay trên máy local rồi hy vọng người khác giống mình.

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

#### Bước 1: tạo file SQL mới

Tạo file:

```text
src-tauri/migrations/0002_add_todo_notes.sql
```

Nội dung ví dụ:

```sql
ALTER TABLE todos ADD COLUMN notes TEXT;
```

#### Bước 2: đăng ký migration trong Rust

Thêm phần tử mới vào `migrations`:

```rust
Migration {
    version: 2,
    description: "add_todo_notes",
    sql: include_str!("../migrations/0002_add_todo_notes.sql"),
    kind: MigrationKind::Up,
}
```

#### Bước 3: cập nhật TypeScript types và query

Ví dụ:

- thêm `notes` vào `TodoRow`
- thêm `notes` vào domain model
- update query `SELECT`
- update form nếu cần

### Rule bắt buộc cho migration

- `version` phải tăng dần, không trùng
- `description` phải ngắn, rõ nghĩa
- Không sửa nội dung migration cũ đã phát hành
- Muốn thay đổi schema tiếp thì tạo migration mới
- SQL phải an toàn để chạy trong môi trường app thật

### Không nên làm

- Không sửa file `0001_...sql` sau khi đã có người dùng chạy app
- Không đổi version migration cũ
- Không rename connection string mà quên cập nhật preload và builder

---

## Quy trình thêm một bảng mới

Ví dụ muốn thêm bảng `projects`.

### 1. Viết migration

```sql
CREATE TABLE IF NOT EXISTS projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Đăng ký migration ở Rust

Thêm `Migration { version: ..., ... }` vào `migrations`.

### 3. Tạo data module mới

Ví dụ:

```text
src/lib/projects-db.ts
```

### 4. Định nghĩa row type và domain type

Ví dụ:

```ts
type ProjectRow = {
  id: number;
  name: string;
  created_at: string;
};

type Project = {
  id: number;
  name: string;
  createdAt: string;
};
```

### 5. Viết hàm CRUD

Ví dụ:

```ts
export async function listProjects() {}
export async function createProject(name: string) {}
export async function deleteProject(id: number) {}
```

### 6. Gọi từ route/page

Không gọi SQL trực tiếp ở route. Route chỉ dùng các hàm trên.

---

## Practice khuyến nghị trong repo này

### 1. Giữ DB access ở `src/lib`

Không viết SQL trong:

- `src/routes/*`
- component UI
- provider

### 2. Tách DB row và UI model

SQLite thường trả:

- `INTEGER` cho boolean
- `snake_case` từ schema SQL

UI thường muốn:

- `boolean`
- `camelCase`

Đừng ép UI hiểu trực tiếp kiểu DB.

### 3. Chỉ dùng một chỗ load database

Giữ `getDatabase()` trong module dùng chung hoặc feature module.

Lợi ích:

- ít boilerplate
- không load nhiều connection không cần thiết
- dễ đổi connection string về sau

### 4. Validate trước khi ghi

Ví dụ:

- title không rỗng
- number/id hợp lệ
- trim chuỗi đầu vào

### 5. Query rõ ràng

Ưu tiên:

- `SELECT id, name, created_at`

Thay vì:

- `SELECT *`

### 6. Schema thực dụng cho desktop app

Nên có sớm:

- `id`
- `created_at`
- `updated_at` nếu record có chỉnh sửa
- flag như `completed`, `archived`, `deleted_at` nếu có workflow rõ

### 7. Không để route biết schema quá sâu

Route nên biết:

- danh sách hàm data layer
- shape domain model

Route không nên biết:

- tên cột DB
- kiểu integer/boolean của SQLite
- connection string

---

## Những lỗi thường gặp

### 1. `no such table`

Nguyên nhân thường là:

- migration chưa đăng ký trong Rust
- connection string giữa Rust và TS không khớp
- preload/config sai

Checklist:

- kiểm tra `src-tauri/src/lib.rs`
- kiểm tra `src-tauri/tauri.conf.json`
- kiểm tra `Database.load("sqlite:todo.db")`

### 2. Permission denied / capability error

Nguyên nhân:

- thiếu `sql:default`
- thiếu `sql:allow-execute`

Kiểm tra `src-tauri/capabilities/default.json`.

### 3. Query chạy nhưng dữ liệu UI sai kiểu

Ví dụ:

- `completed` từ DB là `0/1`, nhưng UI lại mong `boolean`

Cách xử lý:

- map ở data layer
- không đẩy raw row lên component

### 4. Migration mới không có hiệu lực

Nguyên nhân:

- quên thêm migration vào vector `migrations`
- `version` bị trùng
- SQL lỗi cú pháp

### 5. `Cargo.toml` bị duplicate dependency

Nếu thêm plugin bằng tay và bằng `cargo add`, manifest có thể bị lặp key.

Hãy giữ mỗi dependency đúng một dòng.

---

## Checklist khi thêm feature mới có dùng SQLite

1. Viết migration SQL mới trong `src-tauri/migrations/`
2. Đăng ký migration trong `src-tauri/src/lib.rs`
3. Tạo hoặc cập nhật data module trong `src/lib/`
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

Cách làm ổn nhất cho repo này là:

- SQLite làm local persistence
- migration quản lý schema
- query gom trong data layer
- route/UI chỉ tiêu thụ hàm data layer

Baseline hiện tại của repo đã có đầy đủ ví dụ thật ở route `/todos`. Khi cần thêm feature mới, hãy copy đúng pattern đó trước rồi mới tinh chỉnh tiếp.
