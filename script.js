const CONFIG = {
  // Isto e apenas um disfarce para evitar numeros obvios no codigo.
  // Nao e criptografia: em um site publico, tudo que aparece no navegador pode ser visto.
  // Exemplo para 5511999999999: ["55", "11", "99999", "9999"]
  whatsAppParts: {
    yours: ["xx", "xx", "xxxxx", "xxxx"],
    partner: ["xx", "xx", "xxxxx", "xxxx"],
  },
  photoPaths: [
    "assets/fotos/foto_x.jpg",
    "assets/fotos/foto_x.jpg",
    "assets/fotos/foto_x.jpg",
    "assets/fotos/foto_x.jpg",
    "assets/fotos/foto_x.jpg",
    "assets/fotos/foto_x.jpg",
    "assets/fotos/foto_x.jpg",
    "assets/fotos/foto_x.jpg",
    "assets/fotos/foto_x.jpeg",
    "assets/fotos/foto_x.jpeg",
  ],
  musicPath: "assets/audio/xxxxx.mp3",
  poems: ["Texto aqui."],
};

const dateForm = document.querySelector("#dateForm");
const dateInput = document.querySelector("#dateInput");
const timeInput = document.querySelector("#timeInput");
const planInput = document.querySelector("#planInput");
const messageInput = document.querySelector("#messageInput");
const photoTrack = document.querySelector("#photoTrack");
const poemText = document.querySelector("#poemText");
const poemDots = document.querySelector("#poemDots");
const yesButton = document.querySelector("#yesButton");
const noButton = document.querySelector("#noButton");
const proposalActions = document.querySelector("#proposalActions");
const stickerRow = document.querySelector("#stickerRow");
const toast = document.querySelector("#toast");
const backgroundMusic = document.querySelector("#backgroundMusic");
const volumeIcon = document.querySelector("#volumeIcon");
const volumeSlider = document.querySelector("#volumeSlider");

let activePoem = 0;
const noRepelRadius = 280;
let photoRailOffset = 0;
let lastPhotoRailFrame = 0;
let lastAudibleVolume = 0.45;
let musicStarted = false;

// Variáveis de controle para evitar estouro de memória e tratar a pegadinha
let noButtonMoveCount = 0;
let isInsideRepelRadius = false;
let cachedCycleSize = null; // Corrige o Layout Thrashing causador do congelamento no F5

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.setTimeout(() => toast.classList.remove("is-visible"), 4200);
}

function formatDate(dateValue) {
  const [year, month, day] = dateValue.split("-");
  return `${day}/${month}/${year}`;
}

function createWhatsAppUrl(phone, message) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

function decodePhone(parts) {
  return parts.join("").replace(/\D/g, "");
}

function hasConfiguredPhone(phone) {
  return phone.length >= 12 && phone.replace(/[05]/g, "").length > 0;
}

function sendDateInvite(event) {
  event.preventDefault();

  const date = formatDate(dateInput.value);
  const time = timeInput.value;
  const plan = planInput.value;
  const extra = messageInput.value.trim();

  // Gera os caracteres de forma dinâmica e nativa sem usar contra-barras literais na string
  const emojiBrilho = String.fromCodePoint(0x2728);
  const emojiCalendario = String.fromCodePoint(0x1f4c5);
  const emojiRelogio = String.fromCodePoint(0x23f0);
  const emojiRosa = String.fromCodePoint(0x1f339);
  const emojiBalao = String.fromCodePoint(0x1f4ac);
  const emojiAlfinete = String.fromCodePoint(0x1f4cc);
  const emojiCarinha = String.fromCodePoint(0x1f970);

  const message = [
    `|_ *DATE MARCADO!* _|`,
    "-----------------------------------------",
    `||*Data:* ${date}`,
    `|| *Hor\u00E1rio:* ${time}`,
    `|| *Plano:* ${plan}`,
    "",
    extra ? `|| *Recadinho do Corac\u00E3o:* _"${extra}"_` : "",
    "-----------------------------------------",
    `_Responda sabiamente o convite com um emoji.`,
  ]
    .filter(Boolean)
    .join("\n");

  const numbers = [
    decodePhone(CONFIG.whatsAppParts.yours),
    decodePhone(CONFIG.whatsAppParts.partner),
  ].filter(hasConfiguredPhone);

  if (numbers.length < 2) {
    showToast(
      "Coloque os dois numeros de WhatsApp no arquivo script.js antes de publicar.",
    );
    return;
  }

  window.open(
    createWhatsAppUrl(numbers[0], message),
    "_blank",
    "noopener,noreferrer",
  );
  window.setTimeout(() => {
    window.open(
      createWhatsAppUrl(numbers[1], message),
      "_blank",
      "noopener,noreferrer",
    );
  }, 400);

  showToast(`Convite preparado com sucesso! ${String.fromCodePoint(0x1f496)}`);
}

function buildPhotoRail() {
  CONFIG.photoPaths.forEach((path, index) => {
    const tile = document.createElement("div");
    tile.className = "photo-tile";
    tile.style.backgroundImage = `url("${path}")`;
    tile.setAttribute("role", "img");
    tile.setAttribute("aria-label", `Foto ${index + 1} do casal`);
    photoTrack.appendChild(tile);

    const image = new Image();
    image.onerror = () => {
      tile.className = "photo-placeholder";
      tile.textContent = "Foto nao encontrada";
      tile.style.backgroundImage = "";
    };
    image.src = path;
  });
}

function animatePhotoRail(timestamp) {
  if (!lastPhotoRailFrame) {
    lastPhotoRailFrame = timestamp;
  }

  const delta = timestamp - lastPhotoRailFrame;
  const isMobileRail = window.matchMedia("(max-width: 920px)").matches;
  const speed = isMobileRail ? 58 : 48;
  const firstItem = photoTrack.firstElementChild;

  if (firstItem) {
    if (!cachedCycleSize) {
      const computedTrack = getComputedStyle(photoTrack);
      const gap = parseFloat(computedTrack.gap) || 0;
      const firstSize = isMobileRail
        ? firstItem.getBoundingClientRect().width
        : firstItem.getBoundingClientRect().height;
      if (firstSize > 0) {
        cachedCycleSize = firstSize + gap;
      }
    }

    photoRailOffset += (speed * delta) / 1000;

    if (
      cachedCycleSize &&
      cachedCycleSize > 0 &&
      photoRailOffset >= cachedCycleSize
    ) {
      photoTrack.appendChild(firstItem);
      photoRailOffset -= cachedCycleSize;
    }

    photoTrack.style.transform = isMobileRail
      ? `translateX(${-photoRailOffset}px)`
      : `translateY(${-photoRailOffset}px)`;
  }

  lastPhotoRailFrame = timestamp;
  window.requestAnimationFrame(animatePhotoRail);
}

function renderPoem() {
  poemText.textContent = CONFIG.poems[activePoem];

  poemDots.querySelectorAll("button").forEach((dot, index) => {
    dot.classList.toggle("is-active", index === activePoem);
  });
}

function buildPoemControls() {
  CONFIG.poems.forEach((_, index) => {
    const dot = document.createElement("button");
    dot.className = "poem-dot";
    dot.type = "button";
    dot.setAttribute("aria-label", `Mostrar poema ${index + 1}`);
    dot.addEventListener("click", () => {
      activePoem = index;
      renderPoem();
    });
    poemDots.appendChild(dot);
  });

  renderPoem();
  window.setInterval(() => {
    activePoem = (activePoem + 1) % CONFIG.poems.length;
    renderPoem();
  }, 5600);
}

function burstHearts() {
  const colors = ["#d94f70", "#ff8aa4", "#ffbd8f", "#a7d7c5", "#5e2438"];

  for (let index = 0; index < 70; index += 1) {
    const heart = document.createElement("span");
    heart.className = "heart";
    heart.textContent = index % 4 === 0 ? "\u2661" : "\u2665";
    heart.style.setProperty("--x", `${Math.random() * 100}vw`);
    heart.style.setProperty("--tx", `${Math.random() * 260 - 130}px`);
    heart.style.setProperty("--s", `${Math.random() * 24 + 18}px`);
    heart.style.setProperty("--d", `${Math.random() * 1.8 + 2.4}s`);
    heart.style.setProperty("--c", colors[index % colors.length]);
    document.body.appendChild(heart);
    window.setTimeout(() => heart.remove(), 4600);
  }
}

function celebrateYes() {
  stickerRow.classList.add("is-happy");
  stickerRow.innerHTML =
    "<span>\u2665</span><span>SIM!</span><span>\u2665</span>";
  burstHearts();
  showToast("Texto do sim do casamento aqui 💗");
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getNoButtonCandidate(
  pointerX,
  pointerY,
  area,
  button,
  maxLeft,
  maxTop,
) {
  const currentLeft = button.left - area.left;
  const currentTop = button.top - area.top;
  const currentCenterX = currentLeft + button.width / 2;
  const currentCenterY = currentTop + button.height / 2;
  const pointerLocalX = pointerX - area.left;
  const pointerLocalY = pointerY - area.top;
  const dx = currentCenterX - pointerLocalX || (Math.random() > 0.5 ? 1 : -1);
  const dy = currentCenterY - pointerLocalY || (Math.random() > 0.5 ? 1 : -1);
  const length = Math.hypot(dx, dy);
  const escapeCenterX = currentCenterX + (dx / length) * noRepelRadius;
  const escapeCenterY = currentCenterY + (dy / length) * noRepelRadius;

  return {
    left: clamp(escapeCenterX - button.width / 2, 0, maxLeft),
    top: clamp(escapeCenterY - button.height / 2, 0, maxTop),
  };
}

// Dispara o susto/brincadeira se tentarem carregar no Não repetidamente
function triggerNoButtonPrank() {
  const popupOverlay = document.querySelector("#popupOverlay");

  // Exibe a foto subindo e a mensagem simultaneamente
  if (popupOverlay) {
    popupOverlay.classList.add("is-visible");
  }

  showToast("Tá querendo apertar o não, humano? 🤨");
  window.setTimeout(() => {
    if (popupOverlay) {
      popupOverlay.classList.remove("is-visible");
    }
    // Força o fechamento do toast junto com a foto
    toast.classList.remove("is-visible");
  }, 3500);
}

function moveNoButton(event, force = false) {
  const area = proposalActions.getBoundingClientRect();
  const button = noButton.getBoundingClientRect();
  const pointerX = event?.clientX ?? area.left + area.width / 2;
  const pointerY = event?.clientY ?? area.top + area.height / 2;
  const buttonCenterX = button.left + button.width / 2;
  const buttonCenterY = button.top + button.height / 2;
  const distance = Math.hypot(
    pointerX - buttonCenterX,
    pointerY - buttonCenterY,
  );

  if (!force && distance > noRepelRadius) {
    isInsideRepelRadius = false; // Cursor saiu da área de repulsão, reinicia o estado
    return;
  }

  // Registra as esquivas discretas de forma correta e sem loops explosivos
  if (!force && event && !isInsideRepelRadius) {
    isInsideRepelRadius = true; // Protege contra chamadas repetitivas dentro do mesmo movimento
    noButtonMoveCount += 1;
    if (noButtonMoveCount >= 5) {
      triggerNoButtonPrank();
      noButtonMoveCount = 0;
    }
  }

  const maxLeft = Math.max(area.width - button.width, 0);
  const maxTop = Math.max(area.height - button.height, 0);
  const candidates = [
    getNoButtonCandidate(pointerX, pointerY, area, button, maxLeft, maxTop),
    { left: 0, top: 0 },
    { left: maxLeft, top: 0 },
    { left: 0, top: maxTop },
    { left: maxLeft, top: maxTop },
  ];

  for (let index = 0; index < 14; index += 1) {
    candidates.push({
      left: Math.random() * maxLeft,
      top: Math.random() * maxTop,
    });
  }

  const safest = candidates.reduce(
    (best, candidate) => {
      const centerX = area.left + candidate.left + button.width / 2;
      const centerY = area.top + candidate.top + button.height / 2;
      const candidateDistance = Math.hypot(
        pointerX - centerX,
        pointerY - centerY,
      );
      return candidateDistance > best.distance
        ? { ...candidate, distance: candidateDistance }
        : best;
    },
    { left: 0, top: 0, distance: -1 },
  );

  noButton.style.left = `${safest.left}px`;
  noButton.style.top = `${safest.top}px`;
}

function setMinimumDate() {
  const today = new Date();
  const offset = today.getTimezoneOffset();
  const localToday = new Date(today.getTime() - offset * 60 * 1000);
  dateInput.min = localToday.toISOString().split("T")[0];
}

function updateVolumeIcon() {
  const isSilent = backgroundMusic.muted || backgroundMusic.volume === 0;
  volumeIcon.innerHTML = isSilent ? "&#128263;" : "&#128266;";
}

async function startMusic() {
  backgroundMusic.src = CONFIG.musicPath;
  backgroundMusic.volume = Number(volumeSlider.value);
  backgroundMusic.muted = backgroundMusic.volume === 0;
  updateVolumeIcon();

  const tryPlay = async () => {
    try {
      await backgroundMusic.play();
      musicStarted = true;
    } catch {
      musicStarted = false;
    }
  };

  const startAfterGesture = () => {
    if (!musicStarted) {
      tryPlay();
    }
  };

  [
    "click",
    "pointerdown",
    "pointerup",
    "keydown",
    "touchstart",
    "wheel",
  ].forEach((eventName) => {
    document.addEventListener(eventName, startAfterGesture, {
      passive: true,
    });
  });

  try {
    await backgroundMusic.play();
    musicStarted = true;
  } catch {
    musicStarted = false;
  }
}

function changeVolume() {
  const nextVolume = Number(volumeSlider.value);
  backgroundMusic.volume = nextVolume;
  backgroundMusic.muted = nextVolume === 0;

  if (nextVolume > 0) {
    lastAudibleVolume = nextVolume;
    backgroundMusic
      .play()
      .then(() => {
        musicStarted = true;
      })
      .catch(() => {
        musicStarted = false;
      });
  }

  updateVolumeIcon();
}

function toggleMute() {
  if (backgroundMusic.muted || backgroundMusic.volume === 0) {
    backgroundMusic.muted = false;
    backgroundMusic.volume = lastAudibleVolume;
    volumeSlider.value = String(lastAudibleVolume);
    backgroundMusic
      .play()
      .then(() => {
        musicStarted = true;
      })
      .catch(() => {
        musicStarted = false;
      });
  } else {
    backgroundMusic.muted = true;
    volumeSlider.value = "0";
  }

  updateVolumeIcon();
}

// Limpa o cache se a janela mudar de tamanho (garante responsividade)
window.addEventListener("resize", () => {
  cachedCycleSize = null;
});

dateForm.addEventListener("submit", sendDateInvite);
volumeSlider.addEventListener("input", changeVolume);
volumeIcon.addEventListener("click", toggleMute);
yesButton.addEventListener("click", celebrateYes);
document.addEventListener("pointermove", moveNoButton);
document.addEventListener("pointerdown", (event) => {
  const button = noButton.getBoundingClientRect();
  const clickedNo =
    event.clientX >= button.left &&
    event.clientX <= button.right &&
    event.clientY >= button.top &&
    event.clientY <= button.bottom;

  if (clickedNo) {
    event.preventDefault();
    moveNoButton(event, true);
  }
});
noButton.addEventListener("focus", () => {
  noButton.blur();
  moveNoButton(undefined, true);
});
noButton.setAttribute("tabindex", "-1");
noButton.setAttribute("aria-disabled", "true");

setMinimumDate();
buildPhotoRail();
window.requestAnimationFrame(animatePhotoRail);
buildPoemControls();
startMusic();
