/**
 * Fetches tweakcn community theme data from the public registry API.
 *
 * Theme IDs were collected by scrolling https://tweakcn.com/community
 * (client-rendered with Next.js Server Actions — no public list API).
 * Each theme is fetched via the stable public endpoint:
 *   GET https://tweakcn.com/r/themes/{themeId}
 *
 * Output: src/shared/tweakcn-themes.json
 */
import { writeFile } from "node:fs/promises";
import path from "node:path";

interface TweakcnTheme {
  id: string;
  name: string;
  cssVars: {
    light: Record<string, string>;
    dark: Record<string, string>;
  };
}

const THEME_REGISTRY_URL = "https://tweakcn.com/r/themes";
const OUTPUT_PATH = path.resolve(
  process.cwd(),
  "src/shared/tweakcn-themes.json",
);
const REQUEST_DELAY_MS = 100;
const CONCURRENCY = 5;

// Collected via Playwright browser automation from https://tweakcn.com/community
// (infinite-scroll page, 105 themes as of 2026-03-02)
const THEME_IDS = [
  "cmlhfpjhw000004l4f4ax3m7z",
  "cmlf6yp47000104ld4ijt51m7",
  "cmlk6zefr000004lbe9jygsqc",
  "cmie97f2b000704l27r9g1p11",
  "cmjgilzlg000404ju2wgs7uj9",
  "cmlm03etv000204lh15608kec",
  "cmlecx2br000004if3m471xxd",
  "cmho4nr9l000h04l1gu419ckw",
  "cmllfu8oc000004l1a0tidj2g",
  "cmkqudn9u000904l4h6ii267o",
  "cmcup07dt000104l4hj4eferh",
  "cmle6znd6000004l4d01e3e18",
  "cmitj1w3m000104jrbc0c5m6e",
  "cmli80zt6000004l757xqgizs",
  "cmlh0x713000104jrgmds6vcd",
  "cmlf2jr3m000204k31tapa3fa",
  "cmjhgwebp000404jl22fv5sh6",
  "cmlmpb3qp000004l5go47hzsv",
  "cmd7k86op000c04johtem5tfr",
  "cmlpw19bo000004l729u94fdg",
  "cmdght103000n04lh3e2ae93r",
  "cmh7sl02y000004k116oq2qn4",
  "cml5dyjea000004jr66ytcg0l",
  "cmlh0ynpe000304k1874nb07w",
  "cmlxzdqhc000004js4867ch0s",
  "cmhxosuz5000804l7gqzefqxg",
  "cmlm09qdq000004l7a6e9681h",
  "cmll14cgf000204ky5ms2fdgj",
  "cmf5pk1cx000104l83645de2s",
  "cmhxpdle4000804le8gkp0rak",
  "cmkybzyzr000004l515sz2eox",
  "cmlf54yxn000104jlgnwd54q1",
  "cmluqysmw000204ji34jja0ul",
  "cmluajfgz000004l5afke7znm",
  "cmbcoaley000204l50adt78o6",
  "cmleu9v0a000104i5ccie20yp",
  "cmle6hiuk000104kw8lul1e5b",
  "cmlrqe6vc000104lbcjpo6cv0",
  "cmi0kusqy000004jlhzfjfpim",
  "cmko81lql000804l74jsw1din",
  "cmkr0i9tr000a04lb7oomh1xp",
  "cmli3sqr4000004le5a0y0d9f",
  "cmlgc7adm000004ladv5x0dav",
  "cmlh0vbnd000004l112kx8a0l",
  "cmleckfgs000104js16vy8rxy",
  "cmm2769u2000004jobride6q4",
  "cmlwpk095000004jp9lj7c9sw",
  "cmlva2weo000104jr85nt08re",
  "cmbco9sbv000104l5a7wd1hn3",
  "cmlqxbfu8000004joajt9gs64",
  "cmkr1zzlc000j04lb9iz9g43m",
  "cmljx037j000004jy614levd3",
  "cmdvtw1tc000104ju0f2m7enb",
  "cmm7cs846000004jrawis0qi0",
  "cmlnfhvh2000004l7ggzsans1",
  "cmm2mehjy000004ibgt6g0rbu",
  "cmlznk552000004jubsv77roj",
  "cmbco7dza000304jqejw88mle",
  "cmlmsmolf000104k4c3cr3fm9",
  "cmlmbzwyz000004l72j9s6i76",
  "cmlge5b8r000204k11l6rdybe",
  "cmlgoymvd000004l76wfnbkh8",
  "cmkwmyqsb000304jubgjk7ipx",
  "cmlewiz0s000304l7hc2n2l1z",
  "cmm5996cv000004l266hbf4mr",
  "cmly8fsie000204l8fqt54s1p",
  "cmlx20lut000104ld58pp82fv",
  "cmgcc1d39000204ky3qhj3qt3",
  "cmlvarth7000504ib3jb18h35",
  "cmlotm6k3000004lb4b7874wm",
  "cmlkz03fw000704l76fe5a1nn",
  "cmlfux6jj000504ky57dngn2b",
  "cmm2dkac7000004jm2euecvt5",
  "cmm2d4a7l000004jubvhf2m4t",
  "cmm1fxa5k000004l5giglhhew",
  "cmlybsck4000004l8c9gbbb8q",
  "cmlwgfq62000004la95bk4nr2",
  "cmlpl4xs2000004laakqi8kra",
  "cmkr0zp1x000f04lb79pf75zf",
  "cmh70ypcp000504jr8bu7hzyr",
  "cmh70ioup000104jr60yx9c30",
  "cmlf3ricb000004jl5z5aftbt",
  "cmlf2g3ai000004l5fle642sy",
  "cmm3xphrf000004l4244v4qb5",
  "cmm3earjf000004lbbthuasae",
  "cmm22ewu3000104l59hacdz6y",
  "cmlzh5zhg000004jmf4vmcx8c",
  "cmftkwy4m000004kyblg3e3mm",
  "cmlwi02dv000004jr7uti2o25",
  "cmlvfa5jn000004jug80j1cyw",
  "cmlpmczkq000204l55xzr8obe",
  "cmh71q7fv000404l1avn3dcp4",
  "cmm85yh8v000004k62pcsd7gi",
  "cmm7up73t000004l23tk28vce",
  "cmm71zs0s000004k2e67feff5",
  "cmm4cktt5000004jxehaheo46",
  "cmm5uzx3g000004l84b9aftwf",
  "cmm4y9w3o000004l79sky7cqm",
  "cmm3srnjn000004l5egbmb4a4",
  "cmm3ngaig000004jl71bt739e",
  "cmlz4fcvq000004jr20ftddr4",
  "cmlwktx0l000204jvgufe5qjx",
  "cmlthmpl1000104l43mwe8zhh",
  "cmi43e93b000504lb6x47bftv",
  "cmh71dtfu000104l10utdclf9",
];

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function toStringRecord(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object") return {};
  const record: Record<string, string> = {};
  for (const [key, entryValue] of Object.entries(value)) {
    if (typeof entryValue === "string") {
      record[key] = entryValue;
    }
  }
  return record;
}

async function fetchTheme(themeId: string): Promise<TweakcnTheme | null> {
  const url = `${THEME_REGISTRY_URL}/${themeId}`;
  const response = await fetch(url);

  if (!response.ok) {
    process.stderr.write(
      `[scrape] Warning: ${themeId} → ${response.status} ${response.statusText}\n`,
    );
    return null;
  }

  const payload = (await response.json()) as {
    name?: unknown;
    cssVars?: { light?: unknown; dark?: unknown };
  };

  if (typeof payload.name !== "string" || !payload.name) {
    process.stderr.write(`[scrape] Warning: ${themeId} → missing name\n`);
    return null;
  }

  return {
    id: themeId,
    name: payload.name,
    cssVars: {
      light: toStringRecord(payload.cssVars?.light),
      dark: toStringRecord(payload.cssVars?.dark),
    },
  };
}

async function fetchBatch(ids: string[]): Promise<(TweakcnTheme | null)[]> {
  return Promise.all(ids.map((id) => fetchTheme(id)));
}

async function main(): Promise<void> {
  process.stdout.write(
    `[scrape] Fetching ${THEME_IDS.length} themes from tweakcn.com (concurrency=${CONCURRENCY})...\n`,
  );

  const themes: TweakcnTheme[] = [];
  const failures: string[] = [];

  for (let i = 0; i < THEME_IDS.length; i += CONCURRENCY) {
    const batch = THEME_IDS.slice(i, i + CONCURRENCY);
    const results = await fetchBatch(batch);

    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      const id = batch[j];
      if (result) {
        themes.push(result);
      } else if (id) {
        failures.push(id);
      }
    }

    const fetched = Math.min(i + CONCURRENCY, THEME_IDS.length);
    process.stdout.write(
      `[scrape] ${fetched}/${THEME_IDS.length} (${themes.length} ok, ${failures.length} failed)\n`,
    );

    if (i + CONCURRENCY < THEME_IDS.length) {
      await sleep(REQUEST_DELAY_MS);
    }
  }

  await writeFile(OUTPUT_PATH, `${JSON.stringify(themes, null, 2)}\n`, "utf8");

  process.stdout.write(
    `[scrape] Done: ${themes.length} themes → ${OUTPUT_PATH}\n`,
  );
  if (failures.length > 0) {
    process.stdout.write(
      `[scrape] Failed (${failures.length}): ${failures.join(", ")}\n`,
    );
  }
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`[scrape] Fatal: ${message}\n`);
  process.exitCode = 1;
});
