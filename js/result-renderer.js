import { TYPE_KO_NAMES } from "./element-mapping.js";

const loadingSection = document.querySelector("#loadingSection");
const loadingText = document.querySelector("#loadingText");
const resultSection = document.querySelector("#resultSection");
const resultCard = document.querySelector("#resultCard");
const messageText = document.querySelector("#messageText");
const formSection = document.querySelector(".form-section");
let latestCaptureMarkup = "";

const ELEMENT_KO_NAMES = {
  木: "목",
  火: "화",
  土: "토",
  金: "금",
  水: "수",
};

const ELEMENT_COPY = {
  목목형: "회복과 성장 스택을 차곡차곡 쌓는 숲의 타입",
  목화형: "잎사귀에 스파크가 튀듯 앞으로 뻗는 돌진 타입",
  목토형: "필드에 뿌리내리고 자기 영역을 넓히는 타입",
  목금형: "부드럽게 자라나면서도 반짝이는 날을 숨긴 타입",
  목수형: "비를 머금고 다시 살아나는 회복형 타입",
  화목형: "불꽃 추진력으로 하늘까지 치고 오르는 타입",
  화화형: "시작부터 끝까지 화력이 꺼지지 않는 타입",
  화토형: "뜨거운 에너지를 단단한 한 방으로 바꾸는 타입",
  화금형: "번개처럼 튀고 강철처럼 꽂히는 타입",
  화수형: "뜨거운 승부욕과 차가운 판단이 번갈아 나오는 타입",
  토목형: "느긋해 보여도 꾸준히 필드를 장악하는 타입",
  토화형: "땅속 열기를 모아 한 번에 터뜨리는 타입",
  토토형: "방어 랭크가 쉽게 내려가지 않는 묵직한 타입",
  토금형: "단단한 몸체를 날카로운 장점으로 다듬는 타입",
  토수형: "흐름을 읽고 자기 페이스로 끌고 가는 타입",
  금목형: "차분한 표정 뒤에 날카로운 반격을 숨긴 타입",
  금화형: "차가운 집중력에 순간 화력이 붙는 타입",
  금토형: "단단한 베이스 위에서 빛나는 방어형 타입",
  금금형: "얼음 결정처럼 차갑고 단단한 희귀 타입",
  금수형: "예리한 감각으로 흐름을 가르는 타입",
  수목형: "조용히 회복하고 어느새 크게 자라나는 타입",
  수화형: "차가운 직감과 뜨거운 필살기가 공존하는 타입",
  수토형: "깊은 물살처럼 상대의 템포를 흔드는 타입",
  수금형: "맑은 물결 위로 날카로운 빛이 스치는 타입",
  수수형: "깊고 조용하게 잠재력을 모으는 타입",
};

const TYPE_PERSONALITY = {
  normal: "어디서든 페이스를 잃지 않는 안정감",
  fire: "불꽃타입의 강렬한 추진력",
  water: "물타입의 유연한 적응력",
  electric: "전기타입의 빠른 반응 속도",
  grass: "풀타입의 회복력과 성장성",
  ice: "얼음타입의 차분한 집중력",
  fighting: "격투타입의 정면 승부 기질",
  poison: "독타입의 예측하기 어려운 변수감",
  ground: "땅타입의 묵직한 버티는 힘",
  flying: "비행타입의 자유로운 상승감",
  psychic: "에스퍼타입의 직감과 읽는 힘",
  bug: "벌레타입의 끈질긴 생존력",
  rock: "바위타입의 단단한 방어감",
  ghost: "고스트타입의 신비로운 존재감",
  dragon: "드래곤타입의 큰 스케일과 잠재력",
  dark: "악타입의 흔들리지 않는 독자성",
  steel: "강철타입의 정교하고 단단한 완성도",
  fairy: "페어리타입의 의외성과 반짝이는 매력",
};

const DATA_SOURCE_LABELS = {
  static: "도감 데이터: 정적 파일 사용 중",
  api: "도감 데이터: API에서 불러옴",
  cache: "도감 데이터: 캐시 사용 중",
  fallback: "도감 데이터: 임시 fallback 사용 중",
};

function formatBirthDate(inputData) {
  const month = String(inputData.month).padStart(2, "0");
  const day = String(inputData.day).padStart(2, "0");
  return `${inputData.year}.${month}.${day}`;
}

function formatBirthTime(inputData) {
  return inputData.hourUnknown ? "시간 모름" : `${inputData.hourRangeLabel} / ${inputData.hourBranch}`;
}

function getElementCopy(typeResult) {
  return (
    ELEMENT_COPY[typeResult.elementLabel] ??
    `${typeResult.typeNamesKo.join(" / ")} 타입의 개성이 섞인 복합 타입`
  );
}

function getTypePersonality(type) {
  return TYPE_PERSONALITY[type] ?? `${TYPE_KO_NAMES[type] ?? type}타입의 개성`;
}

function getPokemonDisplayName(matchResult) {
  if (matchResult?.status !== "matched") {
    return "이 타입 조합";
  }

  return matchResult.pokemon.nameKo;
}

function getElementDescription(typeResult, matchResult) {
  const primaryTypeName = TYPE_KO_NAMES[typeResult.primaryType] ?? typeResult.primaryType;
  const secondaryTypeName = TYPE_KO_NAMES[typeResult.secondaryType] ?? typeResult.secondaryType;
  const primaryTrait = getTypePersonality(typeResult.primaryType);
  const secondaryTrait = getTypePersonality(typeResult.secondaryType);
  const pokemonName = getPokemonDisplayName(matchResult);

  if (typeResult.primaryType === typeResult.secondaryType) {
    return `당신의 타입 에너지는 ${primaryTypeName} 단일 타입으로 선명하게 모였습니다. ${primaryTrait}이 특히 강하게 나타나고, 그중에서도 ${pokemonName}와 가장 비슷한 배틀 감각을 가진 결과로 매칭되었습니다.`;
  }

  if (typeResult.primaryElement === typeResult.secondaryElement) {
    return `당신의 타입 에너지는 ${primaryTypeName}/${secondaryTypeName} 계열에 강하게 몰려 있습니다. ${primaryTrait}이 특히 선명하고, 그 안에서도 ${pokemonName}와 가장 비슷한 배틀 감각을 가진 결과로 매칭되었습니다.`;
  }

  return `당신에게서는 ${primaryTrait}과 ${secondaryTrait}이 함께 나타납니다. 그래서 ${primaryTypeName}/${secondaryTypeName} 타입의 결을 가진 포켓몬 중에서도 ${pokemonName}와 가장 비슷한 성향으로 매칭되었습니다.`;
}

function renderTypeChips(types) {
  return [...new Set(types)]
    .map((type) => `<span class="type-chip type-${type}">${TYPE_KO_NAMES[type] ?? type}</span>`)
    .join("");
}

function formatDexNumber(id) {
  return `No.${String(id).padStart(4, "0")}`;
}

function getLocalPokemonImageSrc(pokemon) {
  return `./assets/images/pokemon/${String(pokemon.id).padStart(4, "0")}.png`;
}

function renderPokemonPortrait(pokemon, label = "포켓몬 이미지") {
  if (!pokemon) {
    return "";
  }

  return `
    <div class="pokemon-portrait">
      <img
        src="${getLocalPokemonImageSrc(pokemon)}"
        data-api-src="${pokemon.imageUrl ?? ""}"
        alt="${pokemon.nameKo} ${label}"
        loading="lazy"
        crossorigin="anonymous"
      />
    </div>
  `;
}

function renderElementBars(sajuResult) {
  const analysisLabel =
    sajuResult.usedCharacterCount === 6
      ? "생시 미입력 기준 6글자 분석"
      : "생년월일시 기준 8글자 분석";

  return `
    <section class="element-bars" aria-label="오행 분포">
      <div class="mini-section-heading">
        <h4>오행 분포</h4>
        <p>${analysisLabel}</p>
      </div>
      ${Object.entries(sajuResult.elements)
        .map(([element, count]) => {
          const percent = Math.round((count / sajuResult.usedCharacterCount) * 100);
          return `
            <div class="element-bar-row element-${element}">
              <span class="element-bar-label">${element}</span>
              <div class="element-bar-track" aria-hidden="true">
                <span style="width: ${percent}%"></span>
              </div>
              <strong>${count}</strong>
            </div>
          `;
        })
        .join("")}
    </section>
  `;
}

function getDataSourceLabel(matchResult) {
  return DATA_SOURCE_LABELS[matchResult.dataSource] ?? DATA_SOURCE_LABELS.api;
}

function renderMetaGrid(sajuResult, typeResult, matchResult) {
  return `
    <dl class="result-meta-grid">
      <div>
        <dt>주 오행</dt>
        <dd>${typeResult.primaryElement}</dd>
      </div>
      <div>
        <dt>보조 오행</dt>
        <dd>${typeResult.secondaryElement}</dd>
      </div>
      <div>
        <dt>오행</dt>
        <dd>${typeResult.elementLabel}</dd>
      </div>
      <div>
        <dt>후보 수</dt>
        <dd>${matchResult.candidatesCount}마리</dd>
      </div>
    </dl>
  `;
}

function renderFanNotice() {
  return `
    <p class="result-fan-notice">
      운세 해석이 아닌 오행 기반 타입 매칭 놀이입니다. 이 사이트는 팬메이드 프로젝트이며 Pokémon 및 관련 명칭의 권리는 각 권리자에게 있습니다. 공식 콘텐츠가 아닙니다.
    </p>
  `;
}

function renderCalculationDebug(sajuResult) {
  const accuracyNotes = sajuResult.accuracyNotes ?? [];
  const notes = [...(sajuResult.notes ?? []), ...accuracyNotes];

  return `
    <details class="calculation-debug">
      <summary>계산 기준 보기</summary>
      <dl>
        <div>
          <dt>계산 모드</dt>
          <dd>${sajuResult.calculationMode ?? "legacy"}</dd>
        </div>
        <div>
          <dt>사용 글자 수</dt>
          <dd>${sajuResult.usedCharacterCount}글자</dd>
        </div>
        <div>
          <dt>수동 보정</dt>
          <dd>${sajuResult.manualOverrideApplied ? "적용됨" : "미적용"}</dd>
        </div>
      </dl>
      <ul>
        ${notes.map((note) => `<li>${note}</li>`).join("")}
      </ul>
    </details>
  `;
}

function getCompatibilityPokemonName(pokemon) {
  return pokemon ? pokemon.nameKo : "후보 없음";
}

function buildShareText(typeResult, matchResult, compatibilityResult) {
  const typeLine = `타입: ${typeResult.typeNamesKo.join(" / ")}`;
  const elementLine = `오행: ${typeResult.elementLabel}`;
  const copyLine = `“${getElementCopy(typeResult)}”`;
  const compatibilityLines = [
    `잘 맞는 포켓몬: ${getCompatibilityPokemonName(compatibilityResult?.compatiblePokemon)}`,
    `부딪히기 쉬운 포켓몬: ${getCompatibilityPokemonName(compatibilityResult?.incompatiblePokemon)}`,
  ];

  if (matchResult.status === "matched") {
    return [
      "나는 생년월일시로 보는 나의 포켓몬에서",
      `[${matchResult.pokemon.nameKo}]이 나왔어.`,
      "",
      typeLine,
      elementLine,
      copyLine,
      "",
      ...compatibilityLines,
      "",
      "팬메이드 오행 타입 매칭 결과입니다.",
    ].join("\n");
  }

  return [
    "나는 생년월일시로 보는 나의 포켓몬에서",
    "[도감 미등록 타입]이 나왔어.",
    "",
    typeLine,
    elementLine,
    "아직 공식 포켓몬에게는 없는 희귀 타입 조합!",
    "",
    ...compatibilityLines,
    "",
    "팬메이드 오행 타입 매칭 결과입니다.",
  ].join("\n");
}

function getCapturePokemonBlock(matchResult) {
  if (matchResult.status === "matched") {
    return `
      <div class="capture-pokemon-layout">
        ${renderPokemonPortrait(matchResult.pokemon, "저장용 결과 이미지")}
        <div>
          <strong>${formatDexNumber(matchResult.pokemon.id)}</strong>
          <h3>${matchResult.pokemon.nameKo}</h3>
          <p>${matchResult.pokemon.nameEn}</p>
        </div>
      </div>
    `;
  }

  if (matchResult.status === "unused-combination") {
    return `
      <div class="capture-mystery-layout">
        <div class="capture-mystery-mark">???</div>
        <div>
          <strong>UNREGISTERED</strong>
          <h3>미발견 포켓몬</h3>
          <p>공식 도감에 아직 없는 조합</p>
        </div>
      </div>
    `;
  }

  return `
    <div class="capture-mystery-layout">
      <div class="capture-mystery-mark">DATA</div>
      <div>
        <strong>TYPE FOUND</strong>
        <h3>타입 계산 완료</h3>
        <p>도감 후보 확인 필요</p>
      </div>
    </div>
  `;
}

function getCaptureTypes(typeResult, matchResult) {
  if (matchResult.status === "matched") {
    return matchResult.pokemon.types;
  }

  if (matchResult.status === "unused-combination") {
    return matchResult.unusedTypes;
  }

  return [typeResult.primaryType, typeResult.secondaryType];
}

function renderCaptureElementSummary(sajuResult) {
  return `
    <div class="capture-elements" aria-label="오행 분포 요약">
      ${Object.entries(sajuResult.elements)
        .map(([element, count]) => {
          const percent = Math.round((count / sajuResult.usedCharacterCount) * 100);
          return `
            <div class="capture-element-row element-${element}">
              <span>${element}</span>
              <div><i style="width: ${percent}%"></i></div>
              <b>${count}</b>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderCaptureCompatibility(compatibilityResult) {
  if (!compatibilityResult) {
    return "";
  }

  return `
    <div class="capture-compat">
      <div>
        <span>잘 맞는 포켓몬</span>
        <strong>${getCompatibilityPokemonName(compatibilityResult.compatiblePokemon)}</strong>
      </div>
      <div>
        <span>부딪히기 쉬운 포켓몬</span>
        <strong>${getCompatibilityPokemonName(compatibilityResult.incompatiblePokemon)}</strong>
      </div>
    </div>
  `;
}

function renderCaptureCard(inputData, sajuResult, typeResult, matchResult, compatibilityResult) {
  return `
    <section class="result-capture-card" data-capture-card aria-label="PNG 저장용 결과 카드">
      <div class="capture-topline">
        <span>MY SAJU POKEMON</span>
        <strong>FAN MADE</strong>
      </div>
      ${getCapturePokemonBlock(matchResult)}
      <div class="capture-type-row">${renderTypeChips(getCaptureTypes(typeResult, matchResult))}</div>
      <div class="capture-copy">
        <p>${typeResult.elementLabel}</p>
        <h4>“${getElementCopy(typeResult)}”</h4>
      </div>
      ${renderCaptureElementSummary(sajuResult)}
      ${renderCaptureCompatibility(compatibilityResult)}
      <div class="capture-footer">
        <span>${formatBirthDate(inputData)}</span>
        <span>${formatBirthTime(inputData)}</span>
      </div>
      <p class="capture-notice">운세 해석이 아닌 오행 기반 타입 매칭 놀이입니다.</p>
    </section>
  `;
}

function waitForImages(target) {
  const images = Array.from(target.querySelectorAll("img"));

  const imageLoadPromise = Promise.all(
    images.map((image) => {
      if (image.complete) {
        return Promise.resolve();
      }

      return new Promise((resolve) => {
        image.addEventListener("load", resolve, { once: true });
        image.addEventListener("error", resolve, { once: true });
      });
    }),
  );

  return Promise.race([
    imageLoadPromise,
    new Promise((resolve) => {
      window.setTimeout(resolve, 5000);
    }),
  ]);
}

function preferApiImagesForCapture(target) {
  target.querySelectorAll(".pokemon-portrait img").forEach((image) => {
    const apiSrc = image.dataset.apiSrc;

    if (apiSrc) {
      image.src = apiSrc;
    }
  });
}

function downloadBlob(blob, fileName) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = fileName;
  document.body.append(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

async function saveResultImage(shareText, button) {
  if (!latestCaptureMarkup) {
    showError("저장할 결과 카드가 아직 준비되지 않았습니다.");
    return;
  }

  if (!window.html2canvas) {
    showError("이미지 저장 도구를 불러오지 못했습니다. 네트워크 연결 후 다시 시도해 주세요.");
    return;
  }

  const originalText = button?.textContent;
  const captureLayer = document.createElement("div");

  try {
    if (button) {
      button.disabled = true;
      button.textContent = "이미지 만드는 중";
    }

    captureLayer.className = "capture-render-layer";
    captureLayer.innerHTML = latestCaptureMarkup;
    document.body.append(captureLayer);

    const captureTarget = captureLayer.querySelector("[data-capture-card]");
    bindImageFallbacks(captureLayer);
    preferApiImagesForCapture(captureTarget);
    await waitForImages(captureTarget);

    const canvas = await window.html2canvas(captureTarget, {
      backgroundColor: null,
      scale: Math.min(3, Math.max(2, window.devicePixelRatio || 2)),
      useCORS: true,
    });
    const blob = await new Promise((resolve) => {
      canvas.toBlob(resolve, "image/png");
    });

    if (!blob) {
      throw new Error("Canvas blob creation failed.");
    }

    const fileName = `saju-pokemon-${Date.now()}.png`;
    const file = new File([blob], fileName, { type: "image/png" });

    if (navigator.canShare?.({ files: [file] })) {
      await navigator.share({
        title: "생년월일시로 보는 나의 포켓몬",
        text: shareText,
        files: [file],
      });
      messageText.textContent = "PNG 이미지를 공유/저장 시트로 보냈습니다.";
    } else {
      downloadBlob(blob, fileName);
      messageText.textContent = "PNG 이미지를 다운로드했습니다.";
    }

    messageText.parentElement.classList.remove("is-error");
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Result image save failed.", error);
      showError("PNG 이미지를 만드는 중 문제가 생겼습니다. 다시 시도해 주세요.");
    }
  } finally {
    captureLayer.remove();

    if (button) {
      button.disabled = false;
      button.textContent = originalText;
    }
  }
}

async function copyResultText(text) {
  try {
    await navigator.clipboard.writeText(text);
    messageText.textContent = "결과 텍스트를 복사했습니다.";
    messageText.parentElement.classList.remove("is-error");
  } catch {
    showError("복사 권한을 사용할 수 없습니다. 브라우저의 클립보드 권한을 확인해 주세요.");
  }
}

function bindResultActions(shareText) {
  const copyButton = resultCard.querySelector("[data-result-action='copy']");
  const shareButton = resultCard.querySelector("[data-result-action='share']");
  const imageButton = resultCard.querySelector("[data-result-action='save-image']");
  const retryButton = resultCard.querySelector("[data-result-action='retry']");

  copyButton?.addEventListener("click", () => {
    copyResultText(shareText);
  });

  shareButton?.addEventListener("click", async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "생년월일시로 보는 나의 포켓몬",
          text: shareText,
        });
        return;
      } catch (error) {
        if (error.name === "AbortError") {
          return;
        }
      }
    }

    copyResultText(shareText);
  });

  imageButton?.addEventListener("click", () => {
    saveResultImage(shareText, imageButton);
  });

  retryButton?.addEventListener("click", () => {
    resultSection.hidden = true;
    messageText.textContent = "입력값을 유지했습니다. 다시 결과를 확인해 보세요.";
    messageText.parentElement.classList.remove("is-error");
    formSection?.scrollIntoView({ behavior: "smooth", block: "start" });
  });
}

function bindImageFallbacks(root = resultCard) {
  root.querySelectorAll(".pokemon-portrait img").forEach((image) => {
    image.addEventListener("error", () => {
      const apiSrc = image.dataset.apiSrc;

      if (apiSrc && image.src !== apiSrc) {
        image.src = apiSrc;
        return;
      }

      image.parentElement.classList.add("is-missing-image");
    });
  });
}

export function showLoading(message) {
  loadingText.textContent = message;
  loadingSection.hidden = false;
}

export function hideLoading() {
  loadingSection.hidden = true;
}

export function showError(message) {
  messageText.textContent = message;
  messageText.parentElement.classList.add("is-error");
  resultSection.hidden = true;
  hideLoading();
}

export function clearError() {
  messageText.textContent = "";
  messageText.parentElement.classList.remove("is-error");
}

function renderMatchedResult(inputData, sajuResult, typeResult, matchResult) {
  return `
    <div class="final-result-hero">
      <p class="result-label">나의 사주 포켓몬</p>
      <div class="pokemon-hero-layout">
        ${renderPokemonPortrait(matchResult.pokemon)}
        <div class="pokemon-title-row">
          <strong>${formatDexNumber(matchResult.pokemon.id)}</strong>
          <h3>${matchResult.pokemon.nameKo}</h3>
          <p class="pokemon-en-name">${matchResult.pokemon.nameEn}</p>
        </div>
      </div>
      <div class="type-chip-row">${renderTypeChips(matchResult.pokemon.types)}</div>
      <p class="result-quote">“${getElementCopy(typeResult)}”</p>
      <p>${getElementDescription(typeResult, matchResult)}</p>
      <p>${matchResult.pokemon.nameKo} 외에도 같은 타입 후보가 ${matchResult.candidatesCount}마리 있었고, 생년월일시 seed로 지금의 포켓몬이 고정 선택되었습니다.</p>
    </div>
    ${renderMetaGrid(sajuResult, typeResult, matchResult)}
  `;
}

function renderUnusedResult(sajuResult, typeResult, matchResult) {
  return `
    <div class="final-result-hero is-rare">
      <p class="result-label">도감 미등록 타입</p>
      <div class="pokemon-title-row">
        <strong>??? 타입</strong>
        <h3>미발견 포켓몬</h3>
      </div>
      <p class="pokemon-en-name">Unregistered Pokemon</p>
      <div class="type-chip-row">${renderTypeChips(matchResult.unusedTypes)}</div>
      <p class="result-quote">“당신은 발견 전의 타입입니다.”</p>
      <p>공식 포켓몬 도감에는 아직 이 타입 조합이 없습니다. 실제 포켓몬 이름이 아니라, 팬메이드 결과로 표시되는 희귀 조합입니다.</p>
    </div>
    ${renderMetaGrid(sajuResult, typeResult, matchResult)}
  `;
}

function renderDataMissingResult(sajuResult, typeResult, matchResult) {
  return `
    <div class="final-result-hero is-missing">
      <p class="result-label">도감 데이터 확인 필요</p>
      <div class="pokemon-title-row">
        <strong>DATA</strong>
        <h3>타입은 계산되었습니다</h3>
      </div>
      <div class="type-chip-row">${renderTypeChips([typeResult.primaryType, typeResult.secondaryType])}</div>
      <p>현재 불러온 도감 데이터에서 이 타입 조합 후보를 찾지 못했습니다.</p>
      <p>API 데이터 범위, 특수 폼, fallback 데이터 부족 때문에 발생할 수 있습니다. 다시 시도하거나 네트워크 연결을 확인해주세요.</p>
    </div>
    ${renderMetaGrid(sajuResult, typeResult, matchResult)}
  `;
}

function renderCompatPokemonCard({ title, label, pokemon, element, reason, tone }) {
  if (!pokemon) {
    return `
      <article class="compat-card ${tone}">
        <p class="compat-label">${label}</p>
        <h4>${title}</h4>
        <p class="compat-reason">이 오행 타입군에서 추천할 포켓몬 후보를 찾지 못했습니다.</p>
      </article>
    `;
  }

  return `
    <article class="compat-card ${tone}">
      <p class="compat-label">${label}</p>
      <div class="compat-pokemon-layout">
        ${renderPokemonPortrait(pokemon, "궁합 포켓몬 이미지")}
        <div class="compat-title-row">
          <strong>${formatDexNumber(pokemon.id)}</strong>
          <h4>${pokemon.nameKo}</h4>
          <p class="pokemon-en-name">${pokemon.nameEn}</p>
        </div>
      </div>
      <div class="type-chip-row">${renderTypeChips(pokemon.types)}</div>
      <p class="compat-element">${element}</p>
      <p class="compat-reason">${reason}</p>
      <p class="compat-reason-sub">
        ${
          tone === "is-good"
            ? "같이 있으면 힘이 붙는 상생 타입으로 가볍게 봐주세요."
            : "같이 있으면 에너지가 새기 쉬운 상극 타입이라는 놀이식 해석입니다."
        }
      </p>
    </article>
  `;
}

function renderCompatibilitySection(compatibilityResult) {
  if (!compatibilityResult) {
    return "";
  }

  return `
    <section class="compatibility-section" aria-label="오행 궁합 포켓몬">
      <div class="mini-section-heading">
        <h4>오행 궁합 포켓몬</h4>
        <p>팬메이드 상생/상극 매칭</p>
      </div>
      <div class="compatibility-grid">
        ${renderCompatPokemonCard({
          title: "나랑 잘 맞는 포켓몬",
          label: "상생 타입",
          pokemon: compatibilityResult.compatiblePokemon,
          element: `궁합 오행: ${compatibilityResult.compatibleElement}`,
          reason: compatibilityResult.compatibleReason,
          tone: "is-good",
        })}
        ${renderCompatPokemonCard({
          title: "나랑 안 맞는 포켓몬",
          label: "상극 타입",
          pokemon: compatibilityResult.incompatiblePokemon,
          element: `충돌 오행: ${compatibilityResult.incompatibleElement}`,
          reason: compatibilityResult.incompatibleReason,
          tone: "is-bad",
        })}
      </div>
    </section>
  `;
}

export function renderFinalResult(inputData, sajuResult, typeResult, matchResult, compatibilityResult = null) {
  const shareText = buildShareText(typeResult, matchResult, compatibilityResult);
  latestCaptureMarkup = renderCaptureCard(
    inputData,
    sajuResult,
    typeResult,
    matchResult,
    compatibilityResult,
  );
  const bodyMarkup =
    matchResult.status === "matched"
      ? renderMatchedResult(inputData, sajuResult, typeResult, matchResult)
      : matchResult.status === "unused-combination"
        ? renderUnusedResult(sajuResult, typeResult, matchResult)
        : renderDataMissingResult(sajuResult, typeResult, matchResult);

  resultCard.innerHTML = `
    <article class="pokemon-result-card">
      <div class="result-topline">
        <span>FINAL MATCH</span>
        <strong>${getDataSourceLabel(matchResult)}</strong>
      </div>

      ${bodyMarkup}
      ${renderElementBars(sajuResult)}
      ${renderCompatibilitySection(compatibilityResult)}
      ${
        sajuResult.manualOverrideApplied
          ? `<p class="manual-override-badge">오행 직접 보정값이 적용되었습니다.</p>`
          : ""
      }
      ${renderCalculationDebug(sajuResult)}

      <div class="result-input-summary">
        <span>${formatBirthDate(inputData)}</span>
        <span>${formatBirthTime(inputData)}</span>
      </div>

      ${
        matchResult.usedFallback
          ? `<p class="data-source-warning">네트워크 문제로 임시 포켓몬 데이터가 사용되었습니다.</p>`
          : ""
      }

      <div class="result-actions">
        <button type="button" class="secondary-button" data-result-action="save-image">PNG 저장하기</button>
        <button type="button" class="secondary-button" data-result-action="copy">결과 복사하기</button>
        <button type="button" class="secondary-button" data-result-action="share">공유하기</button>
        <button type="button" class="secondary-button is-quiet" data-result-action="retry">다시 하기</button>
      </div>

      ${renderFanNotice()}
    </article>
  `;

  bindResultActions(shareText);
  bindImageFallbacks();
  messageText.textContent = "매칭 완료. 같은 입력값은 같은 포켓몬으로 고정됩니다.";
  messageText.parentElement.classList.remove("is-error");
  resultSection.hidden = false;
}
