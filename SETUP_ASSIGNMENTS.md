# Setup Tabel Assignments (Tugas PDF)

Fitur **Buat Tugas PDF** menyimpan tugas yang sudah dibuat guru ke Supabase agar bisa dibuka & diekspor ulang kapan saja.

Sebelum memakai fitur ini di production, jalankan SQL berikut di **Supabase Dashboard → SQL Editor**.

```sql
-- 1. Tabel utama
create table if not exists public.assignments (
  id              uuid          primary key default gen_random_uuid(),
  title           text          not null,
  description     text,
  instructions    text,
  school_name     text,
  show_answer_key boolean       not null default false,
  question_ids    jsonb         not null default '[]'::jsonb,
  created_by      uuid          references auth.users(id) on delete set null,
  created_at      timestamptz   not null default now(),
  updated_at      timestamptz   not null default now()
);

-- 2. Trigger untuk auto-update kolom updated_at
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_assignments_updated_at on public.assignments;
create trigger trg_assignments_updated_at
  before update on public.assignments
  for each row execute function public.set_updated_at();

-- 3. Row Level Security
alter table public.assignments enable row level security;

-- Setiap user hanya bisa mengakses tugas miliknya sendiri
drop policy if exists "assignments_select_own" on public.assignments;
create policy "assignments_select_own"
  on public.assignments for select
  using (auth.uid() = created_by);

drop policy if exists "assignments_insert_own" on public.assignments;
create policy "assignments_insert_own"
  on public.assignments for insert
  with check (auth.uid() = created_by);

drop policy if exists "assignments_update_own" on public.assignments;
create policy "assignments_update_own"
  on public.assignments for update
  using (auth.uid() = created_by);

drop policy if exists "assignments_delete_own" on public.assignments;
create policy "assignments_delete_own"
  on public.assignments for delete
  using (auth.uid() = created_by);
```

## Catatan Storage / CORS

Gambar soal disimpan di Supabase Storage dan dipakai langsung di PDF.
Jika saat klik **Unduh PDF** gambar muncul kosong, periksa policy CORS bucket
storage Anda (idealnya bucket bersifat **public**, dan domain aplikasi
diizinkan). Komponen frontend sudah memakai `crossOrigin="anonymous"` +
`useCORS: true` saat capture canvas.

## Struktur kolom

| Kolom             | Tipe        | Keterangan                                            |
|-------------------|-------------|-------------------------------------------------------|
| `id`              | uuid        | Primary key                                           |
| `title`           | text        | Judul tugas (misal: "Latihan Tema 1 - Hewan")         |
| `description`     | text        | Deskripsi singkat (opsional)                          |
| `instructions`    | text        | Instruksi pengerjaan untuk siswa (opsional)           |
| `school_name`     | text        | Nama sekolah / lembaga (opsional, muncul di header)   |
| `show_answer_key` | boolean     | Default tampilan kunci jawaban di preview/PDF         |
| `question_ids`    | jsonb       | Array urut ID soal yang dipilih                       |
| `created_by`      | uuid        | FK ke auth.users (pemilik tugas)                      |
| `created_at`      | timestamptz | Waktu pembuatan                                       |
| `updated_at`      | timestamptz | Waktu update terakhir (otomatis via trigger)          |
