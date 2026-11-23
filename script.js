const video = document.getElementById("video");
const filterCanvas = document.getElementById("filterCanvas");
const overlay = document.getElementById("overlay");
const canvas = document.getElementById("canvas");
const recordingCanvas = document.getElementById("recordingCanvas");
const galleryInput = document.getElementById("gallery-input");
const openGalleryBtn = document.getElementById("open-gallery");
const chooseGalleryBtn = document.getElementById("choose-gallery");

/* PERSONALIZAÇÃO DO EVENTO: atualize este nome e a versão sem espaços abaixo. */
const EVENT_NAME = "Alice 1 aninho";
const EVENT_FILE_SLUG = "alice-1-aninho";
const GALLERY_OUTPUT_SIZE = { width: 1080, height: 1920 };

const coverScreen = document.getElementById("cover-screen");
const cameraScreen = document.getElementById("camera-screen");
const openFilterBtn = document.getElementById("open-filter");
const backToCoverBtn = document.getElementById("back-to-cover");

const captureBtn = document.getElementById("capture");
const switchCameraBtn = document.getElementById("switch-camera");
const filterButtons = document.querySelectorAll(".filter-option");

const previewContainer = document.getElementById("preview-container");
const photoPreview = document.getElementById("photo-preview");
const saveBtn = document.getElementById("save-btn");
const shareBtn = document.getElementById("share-btn");
const retryBtn = document.getElementById("retry-btn");
const instructions = document.getElementById("instructions");

const startRecordBtn = document.getElementById("start-recording");
const stopRecordBtn = document.getElementById("stop-recording");
const recordingIndicator = document.getElementById("recording-indicator");

const videoPreviewContainer = document.getElementById("video-preview-container");
const videoPreview = document.getElementById("video-preview");
const saveVideoBtn = document.getElementById("save-video-btn");
const videoInstructions = document.getElementById("video-instructions");
const loadingMessage = document.getElementById("loading-message");

let stream = null;
let usingFrontCamera = true;
let selectedFilter = "normal";
let galleryImage = null;
let galleryObjectUrl = null;

let mediaRecorder = null;
let recordedChunks = [];
let recordedMimeType = "video/webm";
let lastVideoUrl = null;
let lastVideoBlob = null;

let isRecording = false;
let recordStartTime = 0;
let recordTimerInterval = null;


/* =====================================================
   4 OPÇÕES
   ===================================================== */

const FILTERS = {

  normal: {
    brightness: 1.00,
    contrast: 1.00,
    saturation: 1.00,
    blur: 0,
    color: null,
    alpha: 0,
    glow: 0
  },

  bright: {
    brightness: 1.34,
    contrast: 1.08,
    saturation: 1.12,
    blur: 2.8,
    color: "#FFF0DD",
    alpha: 0.20,
    glow: 0.16
  },

  warm: {
    brightness: 1.18,
    contrast: 1.12,
    saturation: 1.30,
    blur: 2.2,
    color: "#FF8B38",
    alpha: 0.30,
    glow: 0.05
  },

  cool: {
    brightness: 1.08,
    contrast: 1.14,
    saturation: 1.16,
    blur: 1.8,
    color: "#7FAFFF",
    alpha: 0.28,
    glow: 0.04
  }

};


/* =====================================================
   SELEÇÃO
   ===================================================== */

filterButtons.forEach(button => {

  button.addEventListener("click", () => {

    selectedFilter = button.dataset.filter;

    filterButtons.forEach(btn => {
      btn.classList.toggle(
        "active",
        btn.dataset.filter === selectedFilter
      );
    });

  });

});


/* =====================================================
   TAMANHO DA CÂMERA
   ===================================================== */

function getVideoSize() {

  const track =
    stream?.getVideoTracks?.()[0];

  const settings =
    track?.getSettings?.() || {};

  return {
    width:
      settings.width ||
      video.videoWidth ||
      1280,

    height:
      settings.height ||
      video.videoHeight ||
      720
  };

}


/* =====================================================
   PREPARAR CANVAS
   ===================================================== */

function prepareCanvas(c, width, height) {

  if (
    c.width !== width ||
    c.height !== height
  ) {
    c.width = width;
    c.height = height;
  }

}


/* =====================================================
   DESENHAR CÂMERA
   ===================================================== */

function drawCamera(ctx, width, height, mirror) {

  ctx.save();

  if (mirror) {
    ctx.translate(width, 0);
    ctx.scale(-1, 1);
  }

  ctx.drawImage(
    video,
    0,
    0,
    width,
    height
  );

  ctx.restore();

}


function drawImageCover(ctx, image, width, height) {

  const sourceWidth = image.naturalWidth || image.width;
  const sourceHeight = image.naturalHeight || image.height;
  const scale = Math.max(width / sourceWidth, height / sourceHeight);
  const cropWidth = width / scale;
  const cropHeight = height / scale;
  const sourceX = (sourceWidth - cropWidth) / 2;
  const sourceY = (sourceHeight - cropHeight) / 2;

  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    cropWidth,
    cropHeight,
    0,
    0,
    width,
    height
  );

}


function drawSource(ctx, width, height, mirror) {

  if (galleryImage) {
    drawImageCover(ctx, galleryImage, width, height);
    return;
  }

  drawCamera(ctx, width, height, mirror);

}


/* =====================================================
   DESENHAR FILTRO
   ===================================================== */

function drawFilteredFrame(
  targetCanvas,
  width,
  height,
  mirror
) {

  const ctx =
    targetCanvas.getContext("2d");

  const filter =
    FILTERS[selectedFilter];

  ctx.clearRect(
    0,
    0,
    width,
    height
  );


  /* NORMAL */

  if (selectedFilter === "normal") {

    drawSource(
      ctx,
      width,
      height,
      mirror
    );

    return;
  }


  /* EFEITO PRINCIPAL */

  ctx.save();

  ctx.filter =
    `blur(${filter.blur}px)
     brightness(${filter.brightness})
     contrast(${filter.contrast})
     saturate(${filter.saturation})`;

  drawSource(
    ctx,
    width,
    height,
    mirror
  );

  ctx.filter = "none";

  ctx.restore();


  /* COR DO FILTRO */

  if (
    filter.color &&
    filter.alpha > 0
  ) {

    ctx.save();

    if (mirror) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.globalCompositeOperation =
      "soft-light";

    ctx.globalAlpha =
      filter.alpha;

    ctx.fillStyle =
      filter.color;

    ctx.fillRect(
      0,
      0,
      width,
      height
    );

    ctx.restore();
  }


  /* LUZ EXTRA */

  if (filter.glow > 0) {

    ctx.save();

    if (mirror) {
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
    }

    ctx.globalCompositeOperation =
      "screen";

    ctx.globalAlpha =
      filter.glow;

    ctx.fillStyle =
      "#FFF7EC";

    ctx.fillRect(
      0,
      0,
      width,
      height
    );

    ctx.restore();
  }

}


/* =====================================================
   RENDERIZAÇÃO AO VIVO
   ===================================================== */

function renderFilter() {

  let size = null;

  if (galleryImage) {
    size = GALLERY_OUTPUT_SIZE;
  } else if (stream && video.readyState >= 2) {
    size = getVideoSize();
  }

  if (size) {
    prepareCanvas(
      filterCanvas,
      size.width,
      size.height
    );

    drawFilteredFrame(
      filterCanvas,
      size.width,
      size.height,
      usingFrontCamera
    );
  }

  requestAnimationFrame(
    renderFilter
  );

}


/* =====================================================
   CÂMERA
   ===================================================== */

async function startCamera() {

  galleryImage = null;
  cameraScreen.classList.remove("gallery-mode");

  if (galleryObjectUrl) {
    URL.revokeObjectURL(galleryObjectUrl);
    galleryObjectUrl = null;
  }

  if (stream) {
    stream
      .getTracks()
      .forEach(track => track.stop());
    stream = null;
  }

  try {
    loadingMessage.style.display =
      "block";

    stream =
      await navigator.mediaDevices.getUserMedia({

        video: {
          facingMode:
            usingFrontCamera
              ? "user"
              : "environment",

          width: {
            ideal: 1920
          },

          height: {
            ideal: 1080
          }
        },

        audio: true

      });


    video.srcObject =
      stream;


    video.style.transform =
      usingFrontCamera
        ? "scaleX(-1)"
        : "scaleX(1)";


    await video.play();


    loadingMessage.style.display =
      "none";


  } catch (error) {

    console.error(error);

    loadingMessage.style.display =
      "none";

    alert(
      "Não foi possível acessar a câmera. Permita o acesso à câmera e ao microfone."
    );

  }

}


/* =====================================================
   ESCOLHER FOTO DA GALERIA
   ===================================================== */

function openGalleryPicker() {
  galleryInput.value = "";
  galleryInput.click();
}

openGalleryBtn.addEventListener("click", openGalleryPicker);
chooseGalleryBtn.addEventListener("click", openGalleryPicker);

galleryInput.addEventListener("change", () => {
  const file = galleryInput.files && galleryInput.files[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    alert("Escolha um arquivo de imagem para colocar na moldura.");
    return;
  }

  const nextObjectUrl = URL.createObjectURL(file);
  const image = new Image();

  image.onload = () => {
    if (galleryObjectUrl) {
      URL.revokeObjectURL(galleryObjectUrl);
    }

    galleryObjectUrl = nextObjectUrl;
    galleryImage = image;

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      stream = null;
    }

    video.pause();
    video.srcObject = null;
    loadingMessage.style.display = "none";
    cameraScreen.classList.add("gallery-mode");
    coverScreen.hidden = true;
    cameraScreen.hidden = false;
    previewContainer.style.display = "none";
    videoPreviewContainer.style.display = "none";
    instructions.style.display = "none";
  };

  image.onerror = () => {
    URL.revokeObjectURL(nextObjectUrl);
    alert("Não foi possível abrir essa imagem. Tente escolher outra foto.");
  };

  image.src = nextObjectUrl;
});


/* =====================================================
   TROCAR CÂMERA
   ===================================================== */

switchCameraBtn.addEventListener(
  "click",
  async () => {

    usingFrontCamera =
      !usingFrontCamera;

    await startCamera();

  }
);


/* =====================================================
   FOTO
   ===================================================== */

captureBtn.addEventListener(
  "click",
  () => {

    if (
      !galleryImage &&
      (!stream || video.readyState < 2)
    ) {
      return;
    }

    const size = galleryImage
      ? GALLERY_OUTPUT_SIZE
      : getVideoSize();

    prepareCanvas(
      canvas,
      size.width,
      size.height
    );


    drawFilteredFrame(
      canvas,
      size.width,
      size.height,
      usingFrontCamera
    );


    const ctx =
      canvas.getContext("2d");


    ctx.drawImage(
      overlay,
      0,
      0,
      size.width,
      size.height
    );


    photoPreview.src =
      canvas.toDataURL("image/png");


    previewContainer.style.display =
      "flex";

  }
);


/* =====================================================
   SALVAR FOTO
   ===================================================== */

saveBtn.addEventListener(
  "click",
  async () => {

    const isAppleMobile =
      /iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isAppleMobile && navigator.share) {
      try {
        const response = await fetch(photoPreview.src);
        const blob = await response.blob();
        const file = new File([blob], `foto-${EVENT_FILE_SLUG}.png`, { type: "image/png" });

        if (!navigator.canShare || navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: "Salvar foto",
            text: "Escolha “Salvar Imagem” ou “Salvar em Fotos” na tela do iPhone.",
            files: [file]
          });
          return;
        }
      } catch (error) {
        if (error.name === "AbortError") return;
      }
    }

    const link =
      document.createElement("a");

    link.download =
      `foto-${EVENT_FILE_SLUG}.png`;

    link.href =
      photoPreview.src;

    link.click();

    if (isAppleMobile) {
      instructions.style.display =
        "block";
    }

  }
);


/* =====================================================
   COMPARTILHAR FOTO
   ===================================================== */

shareBtn.addEventListener("click", async () => {
  if (!photoPreview.src) return;

  try {
    const response = await fetch(photoPreview.src);
    const blob = await response.blob();
    const file = new File([blob], `foto-${EVENT_FILE_SLUG}.png`, { type: "image/png" });

    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
      await navigator.share({
        title: `Foto de ${EVENT_NAME}`,
        text: `Meu momento com a moldura de ${EVENT_NAME} ✨`,
        files: [file]
      });
      return;
    }

    saveBtn.click();
    alert("A foto foi preparada para salvar. Depois, abra o Instagram e publique nos Stories ou no Feed.");
  } catch (error) {
    if (error.name !== "AbortError") {
      alert("Não foi possível abrir o compartilhamento. Salve a foto e envie pelo Instagram.");
    }
  }
});


/* =====================================================
   TIRAR OUTRA
   ===================================================== */

retryBtn.addEventListener(
  "click",
  () => {

    previewContainer.style.display =
      "none";

    instructions.style.display =
      "none";

    cameraScreen.hidden = false;

  }
);


/* =====================================================
   TIMER
   ===================================================== */

function startRecordingTimer() {

  recordStartTime =
    Date.now();

  recordingIndicator.style.display =
    "block";

  recordingIndicator.textContent =
    "🔴 REC 00:00";


  recordTimerInterval =
    setInterval(() => {

      const seconds =
        Math.floor(
          (Date.now() - recordStartTime) /
          1000
        );

      const minutes =
        String(
          Math.floor(seconds / 60)
        ).padStart(2, "0");

      const rest =
        String(
          seconds % 60
        ).padStart(2, "0");

      recordingIndicator.textContent =
        `🔴 REC ${minutes}:${rest}`;

    }, 500);

}


function stopRecordingTimer() {

  clearInterval(
    recordTimerInterval
  );

  recordTimerInterval =
    null;

  recordingIndicator.style.display =
    "none";

}


/* =====================================================
   GRAVAR VÍDEO
   ===================================================== */

function startVideoRecording() {

  if (
    !stream ||
    isRecording
  ) {
    return;
  }


  const size =
    getVideoSize();


  const targetWidth =
    640;

  const targetHeight =
    Math.round(
      size.height *
      targetWidth /
      size.width
    );


  recordingCanvas.width =
    targetWidth;

  recordingCanvas.height =
    targetHeight;


  const rctx =
    recordingCanvas.getContext("2d");


  isRecording =
    true;

  recordedChunks =
    [];


  videoPreviewContainer.style.display =
    "none";


  function drawRecordingFrame() {

    if (!isRecording) {
      return;
    }


    drawFilteredFrame(
      recordingCanvas,
      targetWidth,
      targetHeight,
      usingFrontCamera
    );


    rctx.drawImage(
      overlay,
      0,
      0,
      targetWidth,
      targetHeight
    );


    requestAnimationFrame(
      drawRecordingFrame
    );

  }


  drawRecordingFrame();


  const videoStream =
    recordingCanvas.captureStream(24);


  const combinedStream =
    new MediaStream();


  videoStream
    .getVideoTracks()
    .forEach(track => {
      combinedStream.addTrack(track);
    });


  stream
    .getAudioTracks()
    .forEach(track => {
      combinedStream.addTrack(track);
    });


  const ios =
    /iPhone|iPad|iPod/i.test(
      navigator.userAgent
    );


  let options = {};

  recordedMimeType =
    "video/webm";


  try {

    if (
      ios &&
      MediaRecorder.isTypeSupported(
        "video/mp4"
      )
    ) {

      options.mimeType =
        "video/mp4";

      recordedMimeType =
        "video/mp4";

    } else if (
      MediaRecorder.isTypeSupported(
        "video/webm;codecs=vp9,opus"
      )
    ) {

      options.mimeType =
        "video/webm;codecs=vp9,opus";

    } else if (
      MediaRecorder.isTypeSupported(
        "video/webm;codecs=vp8,opus"
      )
    ) {

      options.mimeType =
        "video/webm;codecs=vp8,opus";

    }


    mediaRecorder =
      new MediaRecorder(
        combinedStream,
        options
      );


  } catch (error) {

    isRecording =
      false;

    alert(
      "Seu navegador não suporta a gravação de vídeo."
    );

    return;

  }


  mediaRecorder.ondataavailable =
    event => {

      if (
        event.data &&
        event.data.size > 0
      ) {

        recordedChunks.push(
          event.data
        );

      }

    };


  mediaRecorder.onstop =
    () => {

      isRecording =
        false;


      const actualMimeType =
        mediaRecorder.mimeType || recordedMimeType;

      recordedMimeType = actualMimeType;

      lastVideoBlob =
        new Blob(
          recordedChunks,
          { type: actualMimeType }
        );


      if (lastVideoUrl) {
        URL.revokeObjectURL(
          lastVideoUrl
        );
      }


      lastVideoUrl =
        URL.createObjectURL(lastVideoBlob);


      videoPreview.src =
        lastVideoUrl;


      videoPreview.load();


      videoPreviewContainer.style.display =
        "flex";


      startRecordBtn.style.display =
        "inline-block";

      stopRecordBtn.style.display =
        "none";

    };


  mediaRecorder.start();

  startRecordingTimer();


  startRecordBtn.style.display =
    "none";

  stopRecordBtn.style.display =
    "inline-block";

}


/* =====================================================
   BOTÕES DE VÍDEO
   ===================================================== */

startRecordBtn.addEventListener(
  "click",
  startVideoRecording
);


stopRecordBtn.addEventListener(
  "click",
  () => {

    if (
      mediaRecorder &&
      mediaRecorder.state ===
        "recording"
    ) {

      isRecording =
        false;

      mediaRecorder.stop();

      stopRecordingTimer();

    }

  }
);


/* =====================================================
   SALVAR VÍDEO
   ===================================================== */

saveVideoBtn.addEventListener(
  "click",
  async () => {

    if (!lastVideoBlob || !lastVideoUrl) return;

    const isAppleMobile =
      /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

    // No iOS, a folha nativa de compartilhamento permite escolher
    // “Salvar Vídeo”, que grava diretamente no app Fotos.
    if (isAppleMobile && navigator.share) {
      try {
        const extension =
          recordedMimeType.includes("mp4") ? "mp4" : "webm";
        const videoFile = new File(
          [lastVideoBlob],
          `video-${EVENT_FILE_SLUG}.${extension}`,
          { type: recordedMimeType }
        );

        if (!navigator.canShare || navigator.canShare({ files: [videoFile] })) {
          await navigator.share({
            title: `Vídeo de ${EVENT_NAME}`,
            files: [videoFile]
          });
          videoInstructions.textContent =
            "Na tela aberta, toque em “Salvar Vídeo” para guardar no app Fotos.";
          videoInstructions.style.display = "block";
          return;
        }
      } catch (error) {
        if (error.name === "AbortError") return;
        console.warn("Compartilhamento de vídeo indisponível:", error);
      }
    }

    // Fallback para navegadores que não oferecem compartilhamento de arquivos.
    const link = document.createElement("a");
    link.href = lastVideoUrl;
    link.download = recordedMimeType.includes("mp4")
      ? `video-${EVENT_FILE_SLUG}.mp4`
      : `video-${EVENT_FILE_SLUG}.webm`;
    document.body.appendChild(link);
    link.click();
    link.remove();

    if (isAppleMobile) {
      videoInstructions.textContent =
        "Este navegador não disponibilizou o envio direto para Fotos. Se o vídeo abrir em Arquivos, toque em Compartilhar e escolha “Salvar Vídeo”.";
      videoInstructions.style.display = "block";
    }
  }
);


/* =====================================================
   INICIAR
   ===================================================== */

openFilterBtn.addEventListener("click", async () => {
  coverScreen.hidden = true;
  cameraScreen.hidden = false;
  await startCamera();
});

backToCoverBtn.addEventListener("click", () => {
  if (stream) {
    stream.getTracks().forEach(track => track.stop());
    stream = null;
  }
  galleryImage = null;
  if (galleryObjectUrl) {
    URL.revokeObjectURL(galleryObjectUrl);
    galleryObjectUrl = null;
  }
  video.pause();
  video.srcObject = null;
  cameraScreen.classList.remove("gallery-mode");
  previewContainer.style.display = "none";
  videoPreviewContainer.style.display = "none";
  cameraScreen.hidden = true;
  coverScreen.hidden = false;
});

renderFilter();
