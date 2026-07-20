# Wavely 작업 규칙

건강 자기관리 데스크톱 앱. Tauri v2 + React 19 + TypeScript + SQLite(tauri-plugin-sql).
컨셉·포지셔닝 근거는 `COMPETITIVE_ANALYSIS.md`, DB 규칙은 `src-tauri/DATABASE.md` 참고.

## 개발 절차 (기능 하나마다 반복)

1. **방향 확인** — 로드맵(`roadmap.html`)과 기존 결정 확인. 새 컨셉이면 구현 전에 사용자와 인터뷰.
2. **구현** — DB 스키마 → 서비스 레이어(`src/lib/*Service.ts`) → UI 순서. 목업 데이터 금지, 실데이터만.
3. **검증** — `npm run check`(타입+lint+테스트) 통과 → 브라우저에서 해당 플로우를 끝까지 직접 조작 → 콘솔 에러 확인.
4. **커밋** — 사용자가 요청할 때만. `.claude/`는 스테이징에서 제외.

## 검증 명령

- `npm run check` — tsc + eslint + vitest 한 번에. 커밋 전 필수 (pre-commit 훅이 자동 실행).
- 처음 클론했다면 `git config core.hooksPath .githooks` 한 번 실행해야 훅이 활성화된다.
- dev 서버는 포트 **1420** 고정. 이미 떠 있으면 재사용, `tauri dev` 실패 시 1420을 점유한 stale 프로세스부터 확인.
- Tauri SQL은 **데스크톱 앱 창에서만** 동작한다. 브라우저 미리보기에선 모든 DB 호출이 실패하는 게 정상이며, 코드는 반드시 `try/catch + // dev browser mode` 패턴으로 감싸 빈 상태로 폴백한다.

## 제품 원칙 (코드에 직접 영향)

- **데이터 정직성**: 기록이 없으면 그럴듯한 숫자 대신 "–"나 빈 상태. 스키마에 없는 지표를 UI에 만들어내지 않는다.
- **측정 언어만**: 인지검사·신체기능 카피에 "향상/훈련/좋아집니다" 금지 → "기록해요/측정해요/기여한다고 알려져 있어요". (Lumosity FTC 벌금 사례. `bodyFunctions.test.ts`가 자동 검사함.)
- **완벽주의 방지**: 스트릭 0 리셋 금지, 커버리지 % 금지, 미달성을 빨간색으로 강조하지 않기.
- **용어**: 파도 (O) / 파동 (X).

## DB 변경 시

`src-tauri/DATABASE.md`의 규칙을 따른다. 요점: 커밋된 마이그레이션은 절대 수정하지 않고 새 버전 추가,
`src/lib/models.ts`와 서비스의 `toXxx()` 매핑도 함께 갱신, DB 접근은 `dbSelect`/`dbExecute`를 통해서만.
