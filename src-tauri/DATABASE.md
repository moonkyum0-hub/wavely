# Wavely 데이터베이스 & 마이그레이션 규칙

Wavely는 로컬 SQLite 파일(`wavely.db`)을 사용해요. 스키마는 `src-tauri/src/lib.rs`의
`migrations` 배열로 관리되고, 앱이 켜질 때 `tauri-plugin-sql`이 아직 적용 안 된
버전만 순서대로 자동 실행해줘요 (한 번 적용된 버전은 그 DB 파일에 다시 실행되지 않음).

## 현재 마이그레이션

| version | 설명 | 테이블 |
|---|---|---|
| 1 | `create_initial_tables` | `health_records`, `goals`, `exercise_logs` |

## 로컬 DB 파일 위치 (Windows)

```
%APPDATA%\com.moony.tauri-app\wavely.db
```

개발 중 스키마를 완전히 처음부터 다시 테스트하고 싶으면 이 파일을 지우고 앱을
다시 실행하면 돼요 (모든 마이그레이션이 처음부터 다시 적용됨). **실제 사용자 데이터가
있는 상태에서는 절대 지우면 안 됨** — 백업 없는 전체 삭제임.

## 규칙

1. **이미 커밋된 마이그레이션의 SQL은 절대 수정하지 않는다.**
   누군가의 로컬 `wavely.db`에 그 버전이 이미 적용됐을 수 있고, `tauri-plugin-sql`은
   버전 번호로만 "적용 여부"를 판단하기 때문에 내용을 바꿔도 이미 적용한 사람에게는
   반영되지 않음. 스키마를 바꿔야 하면 **새 버전을 추가**한다.

   ```rust
   Migration {
       version: 2,
       description: "add_something",
       sql: "ALTER TABLE health_records ADD COLUMN mood_note TEXT;",
       kind: MigrationKind::Up,
   },
   ```

   예외: 아직 커밋도 안 하고 실제로 쓰지도 않은, 같은 작업 세션 안에서 추가했다가
   바로 되돌리는 마이그레이션은 그냥 지워도 됨 (2026-07-15에 PIN 기능 시도 때
   `app_settings` 테이블용 v2를 추가했다가 기능 자체를 취소하면서 삭제한 사례 있음 —
   커밋된 적이 없어서 문제없음).

2. **컬럼 추가는 안전, 삭제/이름변경/타입변경은 안전하지 않다.**
   SQLite는 `ALTER TABLE ... ADD COLUMN`은 지원하지만 컬럼 삭제·이름변경·타입변경은
   버전에 따라 제한적이거나 아예 안 됨. 이런 변경이 필요하면 "새 테이블 만들고 →
   데이터 복사 → 기존 테이블 삭제 → 이름 변경" 패턴을 새 마이그레이션 안에 전부
   SQL로 작성한다.

3. **버전 번호는 항상 1씩 증가, 건너뛰지 않는다.**
   `tauri-plugin-sql`은 순서대로 적용하므로 번호가 비면 혼란만 생김.

4. **`CREATE TABLE`은 항상 `IF NOT EXISTS`를 쓴다** (이미 하고 있음) —
   같은 마이그레이션이 실수로 두 번 실행돼도 안전하도록.

5. **프론트엔드 타입도 같이 맞춘다.**
   테이블 구조를 바꾸면 `src/lib/models.ts`(TS 인터페이스)와 각
   `src/lib/*Service.ts`의 `toXxx()` row-매핑 함수도 같이 수정해야 함. DB 컬럼은
   `snake_case`, TS 필드는 `camelCase` — 이 매핑이 서비스 파일들의 유일한 책임이니
   여기서만 변환하고 나머지 코드는 항상 camelCase만 다루게 유지한다.

6. **읽기/쓰기는 `db.ts`의 `dbSelect`/`dbExecute`를 거친다.**
   `getDb()`를 직접 호출하지 않는다 — `dbExecute`/`dbSelect`가 재시도 로직과 실패
   시 토스트 알림을 담당하고 있음 (자세한 내용은 `src/lib/db.ts` 참고).
