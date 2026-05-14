import {
  clearError,
  hideLoading,
  renderFinalResult,
  showError,
  showLoading,
} from "./result-renderer.js";
import { getPokemonTypeFromElements } from "./element-mapping.js";
import { calculateSaju } from "./saju.js";
import { getPokemonPool } from "./pokemon-api.js";
import { matchPokemon } from "./pokemon-matcher.js";
import { getCompatibilityPokemon } from "./compatibility.js";

const form = document.querySelector("#birthForm");
const resultSection = document.querySelector("#resultSection");
const submitButton = form.querySelector("button[type='submit']");
const defaultSubmitButtonText = submitButton.textContent;
const customSelects = [];

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function getSelectedHourOption(formElement) {
  return formElement.elements.birthHour.selectedOptions[0];
}

function closeCustomSelect(selectState) {
  selectState.root.classList.remove("is-open");
  selectState.button.setAttribute("aria-expanded", "false");
}

function closeOtherCustomSelects(activeSelectState) {
  customSelects.forEach((selectState) => {
    if (selectState !== activeSelectState) {
      closeCustomSelect(selectState);
    }
  });
}

function updateCustomSelectLabel(selectElement, button) {
  const selectedOption = selectElement.selectedOptions[0];
  button.textContent = selectedOption ? selectedOption.textContent.trim() : "선택";
}

function selectCustomOption(selectState, optionElement) {
  selectState.select.value = optionElement.dataset.value;
  selectState.select.dispatchEvent(new Event("change", { bubbles: true }));
  updateCustomSelectLabel(selectState.select, selectState.button);

  selectState.options.forEach((option) => {
    const isSelected = option === optionElement;
    option.classList.toggle("is-selected", isSelected);
    option.setAttribute("aria-selected", String(isSelected));
  });

  closeCustomSelect(selectState);
  selectState.button.focus();
}

function createCustomSelect(selectElement) {
  const root = document.createElement("div");
  const button = document.createElement("button");
  const list = document.createElement("div");
  const options = Array.from(selectElement.options).map((nativeOption) => {
    const option = document.createElement("button");

    option.type = "button";
    option.className = "custom-select-option";
    option.dataset.value = nativeOption.value;
    option.textContent = nativeOption.textContent.trim();
    option.setAttribute("role", "option");
    option.setAttribute("aria-selected", String(nativeOption.selected));

    option.addEventListener("click", () => {
      selectCustomOption(selectState, option);
    });

    return option;
  });
  const selectState = { root, button, list, select: selectElement, options };

  root.className = "custom-select";
  button.type = "button";
  button.className = "custom-select-button";
  button.setAttribute("aria-haspopup", "listbox");
  button.setAttribute("aria-expanded", "false");
  list.className = "custom-select-list";
  list.setAttribute("role", "listbox");

  options.forEach((option) => {
    list.append(option);
  });

  updateCustomSelectLabel(selectElement, button);

  button.addEventListener("click", () => {
    const isOpen = root.classList.contains("is-open");
    closeOtherCustomSelects(selectState);
    root.classList.toggle("is-open", !isOpen);
    button.setAttribute("aria-expanded", String(!isOpen));
  });

  button.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closeCustomSelect(selectState);
    }
  });

  root.append(button, list);
  selectElement.classList.add("native-select-hidden");
  selectElement.insertAdjacentElement("afterend", root);
  customSelects.push(selectState);
}

function initCustomSelects() {
  form.querySelectorAll("select").forEach(createCustomSelect);

  document.addEventListener("click", (event) => {
    customSelects.forEach((selectState) => {
      if (!selectState.root.contains(event.target)) {
        closeCustomSelect(selectState);
      }
    });
  });
}

function readBirthForm(formElement) {
  const formData = new FormData(formElement);
  const year = Number(formData.get("birthYear"));
  const month = Number(formData.get("birthMonth"));
  const day = Number(formData.get("birthDay"));
  const hourOption = getSelectedHourOption(formElement);
  const hourUnknown = hourOption.value === "unknown";

  return {
    year,
    month,
    day,
    hourBranch: hourUnknown ? null : hourOption.value,
    hourRangeLabel: hourOption.dataset.rangeLabel,
    hourValue: Number(hourOption.dataset.hourValue),
    hourUnknown,
  };
}

function readManualElements(formElement) {
  const formData = new FormData(formElement);
  const entries = {
    木: formData.get("manualWood"),
    火: formData.get("manualFire"),
    土: formData.get("manualEarth"),
    金: formData.get("manualMetal"),
    水: formData.get("manualWater"),
  };
  const hasAnyValue = Object.values(entries).some((value) => value !== "");

  if (!hasAnyValue) {
    return null;
  }

  return Object.fromEntries(
    Object.entries(entries).map(([element, value]) => [element, value === "" ? 0 : Number(value)]),
  );
}

function validateBirthInput(inputData) {
  if (!inputData.year || !inputData.month || !inputData.day) {
    return "생년, 생월, 생일을 모두 입력해 주세요.";
  }

  if (inputData.year < 1900 || inputData.year > 2100) {
    return "생년은 1900년부터 2100년 사이로 입력해 주세요.";
  }

  const maxDay = getDaysInMonth(inputData.year, inputData.month);

  if (inputData.day > maxDay) {
    return `${inputData.year}년 ${inputData.month}월에는 ${inputData.day}일이 없습니다.`;
  }

  return "";
}

function wait(ms) {
  return new Promise((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function setSubmitLoading(isLoading, label = "계산 중") {
  submitButton.disabled = isLoading;
  submitButton.textContent = isLoading ? label : defaultSubmitButtonText;
}

async function handleSubmit(event) {
  event.preventDefault();

  const inputData = readBirthForm(form);
  const validationMessage = validateBirthInput(inputData);

  resultSection.hidden = true;
  hideLoading();

  if (validationMessage) {
    showError(validationMessage);
    return;
  }

  try {
    clearError();
    setSubmitLoading(true, "계산 중");
    showLoading("사주 오행을 계산하는 중입니다...");

    await wait(250);
    const sajuResult = calculateSaju(inputData, {
      manualElements: readManualElements(form),
    });
    const typeResult = getPokemonTypeFromElements(sajuResult);

    setSubmitLoading(true, "도감 불러오는 중");
    showLoading("포켓몬 도감을 불러오는 중입니다... 처음 실행 시 시간이 조금 걸릴 수 있습니다.");

    const pokemonPool = await getPokemonPool({
      onProgress: ({ done, total }) => {
        showLoading(`포켓몬 도감을 불러오는 중입니다... ${done}/${total}`);
      },
    });
    const matchResult = matchPokemon(typeResult, inputData, pokemonPool, sajuResult);
    const compatibilityResult = getCompatibilityPokemon(typeResult, inputData, pokemonPool);

    hideLoading();
    renderFinalResult(inputData, sajuResult, typeResult, matchResult, compatibilityResult);
  } catch (error) {
    console.error(error);
    showError("결과를 준비하는 중 문제가 생겼습니다. 잠시 후 다시 시도해 주세요.");
  } finally {
    setSubmitLoading(false);
  }
}

initCustomSelects();
form.addEventListener("submit", handleSubmit);
