# ANYON - 자체 서비스 전환 마스터 플랜

> 생성일: 2025-02-10
> 업데이트: 2025-02-10
> 상태: 계획 수립 완료, 실행 대기

## 서비스 정보

| 항목        | 값            |
| ----------- | ------------- |
| 서비스명    | **ANYON**     |
| 회사명      | **SLIT**      |
| Pro 요금제  | **ANYON Pro** |
| 메인 도메인 | `any-on.dev`  |
| 랜딩페이지  | `any-on.com`  |

## 인프라 URL

| 서비스      | URL                         | 상태      |
| ----------- | --------------------------- | --------- |
| LLM 프록시  | `https://engine.any-on.dev` | 구축 필요 |
| API 서버    | `https://api.any-on.dev`    | 구축 필요 |
| 결제 포탈   | `https://pay.any-on.dev`    | 구축 필요 |
| OAuth 서버  | `https://oauth.any-on.dev`  | 있음      |
| 문서 사이트 | `https://docs.any-on.dev`   | 선택      |

## 기술 아키텍처

```
현재 (Dyad 오리지널):
  앱 → engine.dyad.sh → LLM 프로바이더

ANYON 아키텍처:
  앱 (Electron)
    └── OpenCode CLI (번들)
          └── SLIT 프록시 (engine.any-on.dev)
                ├── 유저 인증 (API 키)
                ├── 사용량 추적
                ├── 구독 티어별 쿼터
                └── LLM 프로바이더 (Anthropic, OpenAI 등)
                      └── API 비용 → SLIT가 부담
```

## 빌드 설정

| 항목            | 값                                    |
| --------------- | ------------------------------------- |
| 딥링크 프로토콜 | `anyon://`                            |
| GitHub 레포     | `github.com/SL-IT-AMAZING/SLIT-ANYON` |
| 자동 업데이트   | GitHub Releases                       |
| 앱 아이콘       | `img/Frame 13.png`                    |

## 비활성화 항목

| 항목                 | 사유                            |
| -------------------- | ------------------------------- |
| Sentry               | 나중에 설정                     |
| PostHog (텔레메트리) | 나중에 설정                     |
| GitHub UI 링크       | 사용 안 함 (버그 리포트 등)     |
| 커뮤니티 링크        | 사용 안 함 (Reddit, YouTube 등) |

---

## 작업 규모 요약

| Phase   | 내용                                 | 예상 공수 | 우선순위  |
| ------- | ------------------------------------ | --------- | --------- |
| Phase 1 | 인프라 연결 (OpenCode → SLIT 프록시) | 1-2일     | P0        |
| Phase 2 | 브랜딩 교체 (Dyad → ANYON)           | 2-3일     | P1        |
| Phase 3 | 빌드/배포 설정                       | 1일       | P1        |
| Phase 4 | 선택적 정리                          | 선택      | P2-P3     |
| 서버    | SLIT 프록시 서버 구축                | 3-5일     | P0 (병렬) |

---

## Phase 의존성 그래프

```
[서버 작업 - 병렬 진행]
  └── 06. SLIT 프록시 서버 구축 ─────────────── 앱과 별개로 진행

[앱 작업]
Phase 1 (인프라 연결)
  ├── 1A. OpenCode → SLIT 프록시 연결 설정 ──── 프록시 URL만 설정
  ├── 1B. ANYON Pro 활성화 플로우 ───────────── 결제 포탈 연동
  └── 1C. 딥링크 프로토콜 변경 (dyad → anyon)

Phase 2 (브랜딩) ← Phase 1 완료 후
  ├── 2A. UI 텍스트 교체 (Dyad → ANYON)
  ├── 2B. URL 교체 (dyad.sh → any-on.dev)
  ├── 2C. 시스템 프롬프트 변경
  └── 2D. GitHub/커뮤니티 링크 제거

Phase 3 (빌드) ← Phase 2 완료 후
  ├── 3A. 패키지 설정 변경
  ├── 3B. 앱 아이콘 교체
  ├── 3C. GitHub Releases 자동 업데이트
  └── 3D. OAuth 서버 URL 설정

Phase 4 (선택) ← 언제든
  ├── 4A. 내부 변수명 정리
  └── 4B. 템플릿 레포 설정
```

---

## 상세 문서

| 문서            | 파일                                                         | 내용                        |
| --------------- | ------------------------------------------------------------ | --------------------------- |
| Phase 1 상세    | [01-phase1-infrastructure.md](./01-phase1-infrastructure.md) | OpenCode + SLIT 프록시 연결 |
| Phase 2 상세    | [02-phase2-branding.md](./02-phase2-branding.md)             | ANYON 브랜딩 교체           |
| Phase 3 상세    | [03-phase3-build-deploy.md](./03-phase3-build-deploy.md)     | 빌드/배포 설정              |
| Phase 4 상세    | [04-phase4-optional.md](./04-phase4-optional.md)             | 선택적 정리                 |
| 파일 체크리스트 | [05-file-checklist.md](./05-file-checklist.md)               | 파일별 변경 목록            |
| 프록시 서버     | [06-proxy-server-plan.md](./06-proxy-server-plan.md)         | SLIT 프록시 서버 구축 계획  |

---

## 리스크

| 리스크                  | 영향                   | 완화                       |
| ----------------------- | ---------------------- | -------------------------- |
| SLIT 프록시 서버 미구축 | 치명적 (Pro 기능 불가) | 앱 작업과 병렬로 서버 개발 |
| OpenCode 버전 호환성    | 중간                   | 특정 버전 고정             |
| 딥링크 OS 등록 실패     | 중간                   | 수동 키 입력 폴백          |
| 결제 웹훅 지연          | 중간                   | 폴링 방식 폴백             |

---

## 실행 순서 권장

```
Week 1:
  [앱] Phase 1 + Phase 2 시작
  [서버] SLIT 프록시 서버 개발 시작

Week 2:
  [앱] Phase 2 완료 + Phase 3
  [서버] 프록시 서버 테스트

Week 3:
  [통합] 앱 ↔ 서버 연동 테스트
  [배포] 베타 릴리스
```
