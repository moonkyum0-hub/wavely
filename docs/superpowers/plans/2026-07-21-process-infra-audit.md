# Wavely/webdev-starter 절차적 뼈대 점검 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wavely(`C:\wavely`)의 개발 프로세스 인프라(테스트/훅/CI)를 점검하고, 발견된 개선사항을 실제 코드에 반영한 뒤 재사용 스타터킷(`C:\webdev-starter`)에도 동일하게 역이식(dogfeed back)한다.

**Architecture:** 두 개의 독립 git 저장소를 다룬다. Wavely가 "실전 검증" 대상, webdev-starter가 "다음 프로젝트에 복사할 뼈대"다. Wavely에서 먼저 개선하고, 검증되면 동일 패턴을 webdev-starter 템플릿에 옮긴다.

**Tech Stack:** Vite + React 19 + TypeScript + Vitest + ESLint(flat config) + Tauri v2(Rust) + GitHub Actions.

## 사전 조사 결과 (이 계획의 근거)

1. **컴포넌트/통합 테스트 부재** — 현재 13개 테스트는 전부 순수 로직(`bodyFunctions.test.ts`, `goalTemplates.test.ts`, `models.test.ts`). `@testing-library/react` 등 미설치. **판단: 지금 단계에서는 문제 아님.** 이유: (a) 페이지가 아직 자주 갈아엎어지는 초기 단계라 컴포넌트 테스트를 지금 붙이면 UI 변경마다 다시 써야 함 — 손해가 더 큼, (b) Tauri SQL은 데스크톱 셸 밖에서 애초에 테스트 불가. 대신 "언제 추가할지" 트리거 기준을 CLAUDE.md에 명문화한다 (Task 2).

2. **pre-commit 훅 속도** — 실측: `npm run check` 41.3초 (tsc 13.1초 + eslint 17.6초 + vitest 0.8초, 나머지는 npm/node 프로세스 기동 오버헤드 ×3). **판단: lint-staged류로 변경 파일만 검사하는 건 안전성을 깎아먹으므로 비추천** — `tsc`는 프로젝트 전체 타입그래프를 보기 때문에 staged 파일만 검사하면 크로스 파일 타입 에러를 놓친다. 대신 **캐시**(tsc `--incremental`, eslint `--cache`)로 반복 실행 시간을 단축한다 (Task 1). 첫 실행(콜드)은 여전히 느리지만, 그 이후 커밋들은 변경분만 재검사한다.

3. **webdev-starter 재사용성** — README의 "복사할 파일" 목록(`CLAUDE.md`/`.github/`/`.githooks/`/`docs/`)에 실제로 필요한 설정 파일이 빠져 있다: `eslint.config.js`, `.prettierrc`, `.gitignore`, `.vscode/extensions.json`, `.env.example`, 예시 테스트 템플릿. 지금 상태로 복사하면 "npm i -D vitest"만 안내받고 lint는 스캐폴드 기본값에 의존하게 되어 wavely에서 검증된 규칙(react-hooks 플러그인, prettier 통합 등)이 빠진다. **Task 4~6에서 채운다.**

4. **표준 안전장치 갭**:
   - GitHub Dependabot 설정 없음 (`gh api repos/.../wavely` 확인: `dependabot_security_updates: disabled`) → `.github/dependabot.yml` 추가 (Task 3). npm 버전 최신화 PR을 자동으로 받게 됨.
   - 커밋 메시지 컨벤션이 wavely `CLAUDE.md`엔 없고 webdev-starter `CLAUDE.md`에만 있음(불일치) → wavely로 backport (Task 2).
   - 시크릿 관리 규칙 미문서화 (아직 API 키 안 쓰지만 로드맵 Phase 5에서 예정) → CLAUDE.md에 사전 가이드라인 + `.env.example` 템플릿 (Task 2, 4).
   - **브랜치 보호 없음** (`gh api .../branches/main/protection` → 404 Not protected, public repo, main에 직접 push 이력)와 **LICENSE 파일 없음**(public repo)은 파일 변경이 아니라 GitHub 저장소 설정/라이선스 선택(법적 결정)이라 이 계획의 실행 범위 밖이다. 계획 마지막에 권장사항으로만 기록하고 사용자 판단을 구한다.
   - GitHub Secret scanning + push protection은 이미 활성화되어 있음(확인됨) — 추가 조치 불필요.

## Global Constraints

- 이 실행에서는 **git commit/push를 하지 않는다** — 파일 변경까지만 수행하고, 각 태스크의 "커밋" 단계는 생략한다. 검토 후 사용자가 직접 커밋을 요청한다.
- 캐시 파일(`.tsbuildinfo`, `.eslintcache`)은 반드시 `node_modules/` 하위 경로에 둬서 기존 `.gitignore` 규칙(`node_modules/`)으로 자동 무시되게 한다 — 새 gitignore 항목을 추가하지 않는다.
- webdev-starter는 프레임워크에 종속되지 않는 걸 목표로 하므로, Tauri 전용 내용(Rust CI job, tauri-vscode 확장 등)은 코멘트로만 안내하고 기본값에는 넣지 않는다.
- 이 계획의 태스크들은 코드 로직이 아니라 설정/문서 변경이므로, "실패하는 테스트 작성" 대신 "변경 전 상태 확인 → 변경 → 명령 실행으로 검증"의 형태를 취한다.

---

### Task 1: Wavely — tsc/eslint 캐시로 `npm run check` 반복 실행 속도 개선

**Files:**
- Modify: `C:\wavely\tsconfig.json`
- Modify: `C:\wavely\package.json` (`lint` script)

**Interfaces:** 없음 (설정 변경만, 런타임 코드에 영향 없음)

- [ ] **Step 1: 변경 전 기준선 측정**

Run: `cd /c/wavely && time npx tsc --noEmit`
Expected: 약 13초 (이미 확인됨: `real 0m13.129s`)

- [ ] **Step 2: `tsconfig.json`에 incremental 컴파일 활성화**

`compilerOptions`에 다음 두 줄 추가 (`"skipLibCheck": true,` 바로 아래):

```json
    "skipLibCheck": true,
    "incremental": true,
    "tsBuildInfoFile": "./node_modules/.cache/tsc.tsbuildinfo",
```

- [ ] **Step 3: `package.json`의 `lint` 스크립트에 캐시 플래그 추가**

변경 전:
```json
    "lint": "eslint src --ext .ts,.tsx",
```

변경 후:
```json
    "lint": "eslint src --ext .ts,.tsx --cache --cache-location node_modules/.cache/eslint/.eslintcache",
```

- [ ] **Step 4: 캐시가 실제로 작동하는지 검증 (2회 연속 실행 비교)**

Run:
```bash
cd /c/wavely
time npx tsc --noEmit          # 1회차: 콜드, .tsbuildinfo 생성
time npx tsc --noEmit          # 2회차: 웜, 변경 없으므로 캐시 히트
time npm run lint              # 1회차: 콜드, .eslintcache 생성
time npm run lint              # 2회차: 웜
```
Expected: 2회차 `tsc`와 `lint` 모두 1회차보다 눈에 띄게 빠름(수 초 단축). `node_modules/.cache/tsc.tsbuildinfo`와 `node_modules/.cache/eslint/.eslintcache` 파일이 생성됨.

- [ ] **Step 5: 캐시 파일이 git에 안 걸리는지 확인**

Run: `cd /c/wavely && git status --short`
Expected: `node_modules/` 하위이므로 새로 추적되는 파일 없음 (기존 `.gitignore`의 `node_modules/` 규칙에 이미 포함).

- [ ] **Step 6: 전체 `npm run check`가 여전히 정상 통과하는지 확인**

Run: `cd /c/wavely && npm run check`
Expected: `Test Files 3 passed (3)`, `Tests 13 passed (13)`, 종료 코드 0.

---

### Task 2: Wavely — CLAUDE.md에 커밋 컨벤션 / 시크릿 관리 / 테스트 정책 추가

**Files:**
- Modify: `C:\wavely\CLAUDE.md`

**Interfaces:** 없음 (문서 변경)

- [ ] **Step 1: 커밋 규칙에 "무엇을"보다 "왜" 컨벤션 backport**

`C:\wavely\CLAUDE.md`의 4번 항목을 찾는다:

```
4. **커밋** — 사용자가 요청할 때만. `.claude/`는 스테이징에서 제외.
```

다음으로 교체:

```
4. **커밋** — 사용자가 요청할 때만. `.claude/`는 스테이징에서 제외. 메시지는 "무엇을"보다 "왜".
```

- [ ] **Step 2: 파일 끝에 "시크릿 관리"와 "테스트 정책" 섹션 추가**

`## DB 변경 시` 섹션 뒤(파일 맨 끝)에 다음을 추가:

```markdown

## 시크릿 관리

아직 외부 API 키를 쓰지 않지만(로드맵 Phase 5에서 AI/API 연동 예정), 처음 추가하는 순간부터 지킨다:

- 키/토큰은 `.env`에만 쓰고 코드에 하드코딩하지 않는다 (`.env`는 이미 `.gitignore`에 있음).
- 필요한 변수 이름만 `.env.example`에 기록하고 값은 비워둔다.
- 커밋 전 `git diff --staged`로 값이 실수로 섞여 들어가지 않았는지 확인한다.

## 테스트 정책

지금은 순수 로직(계산·검증·카피 가드레일)만 테스트한다. 페이지 구조가 아직 자주
갈아엎어지는 단계라 컴포넌트 테스트를 지금 붙이면 UI가 바뀔 때마다 다시 써야 해서
손해가 더 크다. 아래 신호 중 하나라도 나타나면 그때 React Testing Library를 추가한다:

- 같은 UI 버그가 두 번 이상 재발했다
- 페이지 구조가 안정되어 리팩터링 빈도가 눈에 띄게 줄었다
- 로드맵 Phase 7(QA & 출시) 진입
```

- [ ] **Step 3: 검증**

Run: `cd /c/wavely && grep -c "시크릿 관리\|테스트 정책\|무엇을.*왜" CLAUDE.md`
Expected: `3` (세 문구 모두 포함됨)

---

### Task 3: Wavely + webdev-starter — Dependabot 설정 추가

**Files:**
- Create: `C:\wavely\.github\dependabot.yml`
- Create: `C:\webdev-starter\.github\dependabot.yml`

**Interfaces:** 없음 (GitHub이 읽는 설정 파일)

- [ ] **Step 1: Wavely에 실제 설정 생성 (npm + cargo + github-actions 3개 에코시스템)**

`C:\wavely\.github\dependabot.yml`:

```yaml
# npm(프론트엔드), cargo(src-tauri), GitHub Actions 버전을 매주 점검해
# 업데이트 PR을 자동으로 올림. 보안 취약점 알림은 GitHub이 별도로 처리하며,
# 이 파일은 정기 버전 최신화용.
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5

  - package-ecosystem: "cargo"
    directory: "/src-tauri"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"
```

- [ ] **Step 2: webdev-starter에 프레임워크 무관 버전 생성 (cargo는 주석으로 안내)**

`C:\webdev-starter\.github\dependabot.yml`:

```yaml
# npm과 GitHub Actions 버전을 매주 점검해 업데이트 PR을 자동으로 올림.
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
    open-pull-requests-limit: 5

  - package-ecosystem: "github-actions"
    directory: "/"
    schedule:
      interval: "weekly"

# Tauri(Rust) 프로젝트라면 아래 블록도 추가:
# - package-ecosystem: "cargo"
#   directory: "/src-tauri"
#   schedule:
#     interval: "weekly"
```

- [ ] **Step 3: YAML 문법 검증**

Run: `cd /c/wavely && node -e "require('yaml') ? null : null" 2>/dev/null; python -c "import yaml,sys; yaml.safe_load(open('.github/dependabot.yml'))" 2>&1 || echo "python/yaml 없으면 생략 가능"`

간단 검증(파이썬 없을 시 대안): `Get-Content` 로 들여쓰기 오류만 육안 확인.
Expected: 파싱 에러 없음.

---

### Task 4: webdev-starter — 복사 즉시 사용 가능한 설정 파일 세트 추가

**Files:**
- Create: `C:\webdev-starter\eslint.config.js`
- Create: `C:\webdev-starter\.prettierrc`
- Create: `C:\webdev-starter\.gitignore`
- Create: `C:\webdev-starter\.vscode\extensions.json`
- Create: `C:\webdev-starter\.env.example`

**Interfaces:** 없음 (복사용 정적 파일)

- [ ] **Step 1: `eslint.config.js` — wavely에서 검증된 flat config를 일반화해서 복사**

`C:\webdev-starter\eslint.config.js`:

```js
import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactPlugin from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import prettier from "eslint-config-prettier";
import globals from "globals";

// React + TS 기본값. Next.js는 eslint-config-next와 규칙이 겹치니
// 합칠 때 충돌하는 항목만 정리해서 쓸 것.
export default [
  js.configs.recommended,
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parser: tsParser,
      parserOptions: { ecmaVersion: "latest", sourceType: "module" },
      globals: globals.browser,
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      react: reactPlugin,
      "react-hooks": reactHooks,
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...reactPlugin.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      "react/react-in-jsx-scope": "off",
    },
    settings: { react: { version: "detect" } },
  },
  prettier,
  { ignores: ["dist/", ".next/", "src-tauri/target/"] },
];
```

- [ ] **Step 2: `.prettierrc` 복사**

`C:\webdev-starter\.prettierrc`:

```json
{
  "semi": true,
  "singleQuote": false,
  "trailingComma": "es5",
  "printWidth": 100,
  "tabWidth": 2
}
```

- [ ] **Step 3: `.gitignore` 생성 (캐시 경로 포함)**

`C:\webdev-starter\.gitignore`:

```
node_modules/
dist/
.next/
src-tauri/target/
.env
*.local
```

- [ ] **Step 4: `.vscode/extensions.json` 생성 (프레임워크 무관 최소 세트)**

`C:\webdev-starter\.vscode\extensions.json`:

```json
{
  "recommendations": ["dbaeumer.vscode-eslint", "esbenp.prettier-vscode"]
}
```

- [ ] **Step 5: `.env.example` 생성**

`C:\webdev-starter\.env.example`:

```
# 필요한 환경변수 이름만 적고 값은 비워둔다. 실제 값은 로컬 .env에만 (커밋 금지).
# 예: VITE_SOME_API_KEY=
```

- [ ] **Step 6: 검증**

Run: `find /c/webdev-starter -maxdepth 2 -type f | sort`
Expected: 5개 신규 파일(`eslint.config.js`, `.prettierrc`, `.gitignore`, `.vscode/extensions.json`, `.env.example`)이 목록에 나타남.

---

### Task 5: webdev-starter — 예시 가드레일 테스트 템플릿 추가

**Files:**
- Create: `C:\webdev-starter\docs\example-guardrail.test.ts.template`

**Interfaces:**
- Consumes: `vitest`의 `describe`/`it`/`expect`/`it.todo`
- Produces: 새 프로젝트가 복사해서 파일명에서 `.template`을 떼고 채워 넣는 실제 테스트 파일의 출발점

- [ ] **Step 1: 템플릿 파일 작성**

`C:\webdev-starter\docs\example-guardrail.test.ts.template`:

```ts
// 복사 후 파일명에서 .template을 떼고, import 대상을 실제 모듈로 바꿔서 쓴다.
// 패턴 1: 순수 로직 검증 — 계산/검증 함수의 입출력을 확인.
// 패턴 2: 카피 가드레일 — 법적/윤리적으로 민감한 문구가 UI 카피에 섞이지 않았는지 자동 검사
//         (예: Lumosity가 "인지 능력이 향상됩니다"를 광고했다가 FTC에 $2M 벌금을 낸 사례).
import { describe, it, expect } from "vitest";
// import { yourPureFunction } from "../src/lib/yourModule";
// import { YOUR_COPY_ARRAY } from "../src/lib/yourModule";

describe("예시: 순수 로직", () => {
  it.todo("계산 함수는 입력에 대해 기대한 값을 돌려준다");
});

describe("예시: 카피 가드레일", () => {
  it.todo('효능을 단정하는 표현("향상됩니다", "개선됩니다" 등)이 섞이지 않았는지 검사');
  // 실제 구현 예:
  // for (const item of YOUR_COPY_ARRAY) {
  //   expect(item.blurb).not.toMatch(/향상시|훈련하|좋아집니다|개선됩니다/);
  // }
});
```

- [ ] **Step 2: 파일이 유효한 TS/vitest 문법인지 확인 (프로젝트 밖이라 실행은 불가, 육안 검토로 대체)**

Run: `cat /c/webdev-starter/docs/example-guardrail.test.ts.template | head -20`
Expected: import 구문과 `describe`/`it.todo` 블록이 문법 오류 없이 출력됨.

---

### Task 6: webdev-starter — README.md / CLAUDE.md를 wavely의 개선사항으로 동기화

**Files:**
- Modify: `C:\webdev-starter\README.md`
- Modify: `C:\webdev-starter\CLAUDE.md`

**Interfaces:** 없음 (문서 변경)

- [ ] **Step 1: README "사용법" 섹션의 2번·3번 스텝을 새 파일 반영해서 교체**

`C:\webdev-starter\README.md`의 다음 블록:

```
# 2. 이 폴더의 파일을 프로젝트 루트로 복사
#    CLAUDE.md / .github/ / .githooks/ / docs/

# 3. 테스트 러너 설치 + package.json에 스크립트 추가
npm i -D vitest
#    "test":  "vitest run",
#    "check": "tsc --noEmit && npm run lint && npm run test"
```

다음으로 교체:

```
# 2. 이 폴더의 파일을 프로젝트 루트로 복사 (스캐폴드 기본 설정을 덮어씀)
#    CLAUDE.md / .github/ / .githooks/ / docs/
#    eslint.config.js / .prettierrc / .gitignore / .vscode/ / .env.example

# 3. 필요한 devDependency 설치
npm i -D vitest prettier eslint-config-prettier eslint-plugin-react \
  eslint-plugin-react-hooks @typescript-eslint/eslint-plugin @typescript-eslint/parser

#    package.json에 스크립트 추가/교체 (캐시로 반복 실행 속도 확보):
#    "lint":  "eslint src --ext .ts,.tsx --cache --cache-location node_modules/.cache/eslint/.eslintcache",
#    "test":  "vitest run",
#    "check": "tsc --noEmit && npm run lint && npm run test"

#    tsconfig.json의 compilerOptions에 추가 (tsc도 캐시 사용):
#    "incremental": true,
#    "tsBuildInfoFile": "./node_modules/.cache/tsc.tsbuildinfo",
```

- [ ] **Step 2: "구성 파일" 표에 신규 파일 행 추가**

기존 표 마지막 행(`docs/COMPETITIVE_ANALYSIS.template.md`) 다음에 추가:

```
| `eslint.config.js` | React+TS ESLint 규칙 (wavely에서 검증됨) |
| `.prettierrc` | 포맷터 설정 |
| `.gitignore` | node_modules/dist/.env 등 기본 무시 목록 |
| `.vscode/extensions.json` | ESLint/Prettier 확장 추천 |
| `.env.example` | 필요한 환경변수 이름만 기록, 값은 비움 |
| `.github/dependabot.yml` | npm/GitHub Actions 버전을 매주 점검해 PR 생성 |
| `docs/example-guardrail.test.ts.template` | 순수 로직 + 카피 가드레일 테스트 시작점 |
```

- [ ] **Step 3: "프로젝트 시작 체크리스트"에 항목 추가**

기존 체크리스트 마지막(`- [ ] 순수 로직에 첫 테스트 — 계산·검증 함수부터`) 다음에 추가:

```
- [ ] Dependabot 활성화 확인 — 저장소 Settings → Code security에서 자동으로 켜짐(파일만으론 부족한 경우 수동 확인)
- [ ] 브랜치 보호 / LICENSE — 저장소를 공개하거나 협업자가 생기면 그때 GitHub 설정에서 별도로 결정 (이 스타터킷 범위 밖)
```

- [ ] **Step 4: CLAUDE.md에 시크릿 관리 / 테스트 정책 섹션 추가 (wavely Task 2와 동일 내용을 일반화)**

`C:\webdev-starter\CLAUDE.md`의 `## 원칙` 섹션 마지막 줄(`- [제품 고유 원칙 추가]`) **바로 앞**에 삽입:

```markdown
- **시크릿 관리**: 키/토큰은 `.env`에만, 코드에 하드코딩 금지. 새 변수가 생기면 `.env.example`에 이름만 기록(값은 비움).
- **테스트 우선순위**: 순수 로직(계산·검증)부터 테스트. UI가 자주 갈아엎어지는 초기 단계에 컴포넌트 테스트를 붙이면 변경마다 다시 써야 해서 손해다 — 같은 버그가 재발하거나 화면 구조가 안정된 뒤에 추가.
```

- [ ] **Step 5: 검증**

Run: `grep -c "시크릿 관리\|테스트 우선순위\|dependabot" /c/webdev-starter/CLAUDE.md /c/webdev-starter/README.md`
Expected: 두 파일 모두 관련 문구가 포함되어 0보다 큰 카운트 반환.

---

## 실행 범위 밖 권장사항 (사용자 결정 필요)

파일 변경만으로 처리할 수 없거나 사용자의 판단이 필요해 이번 실행에 포함하지 않음:

1. **브랜치 보호 규칙** — wavely `main`은 현재 보호되지 않음(확인됨: 404 Not protected). 협업자가 생기기 전까지는 솔로 개발 워크플로우에 불필요한 마찰일 수 있음. 필요해지면 GitHub 저장소 Settings → Branches에서 "Require status checks to pass"만 켜는 정도를 권장 (PR 자체를 강제하진 않는 선에서).
2. **LICENSE 파일** — wavely는 public repo인데 라이선스가 없음(전체 저작권 보유 상태, 남이 써도 되는지 불명확). MIT/Apache-2.0 등 어떤 라이선스를 원하는지, 혹은 명시적으로 "라이선스 없음"을 유지할지는 법적/사업적 결정이라 임의로 선택하지 않음.

이 두 가지는 원하시면 별도로 진행할 수 있습니다.
