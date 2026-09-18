import { app } from "../../scripts/app.js";
import { api } from "../../scripts/api.js";

// Load stylesheet with cache-busting to ensure latest styles
const cssLink = document.createElement("link");
cssLink.rel = "stylesheet";
cssLink.type = "text/css";
cssLink.href = new URL("./wox_cinema.css?v=" + Date.now(), import.meta.url).href;
document.head.appendChild(cssLink);

app.registerExtension({
    name: "WOX.CinemaStudio",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name !== "WOXCinemaStudioNode") {
            return;
        }

        const onNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function () {
            const r = onNodeCreated ? onNodeCreated.apply(this, arguments) : undefined;
            const node = this;

            // Set default dimension (expanded for Video Montage Timeline Sequencer)
            node.setSize([820, 800]);

            const getWidget = (name) => node.widgets?.find(w => w.name === name);

            // Container Element
            const container = document.createElement("div");
            container.className = "wox-container";
            container.style.minHeight = "476px";
            container.style.height = "auto";
            container.tabIndex = 0;
            container.style.outline = "none";

            // Monochromatic SVG Icons definition (Available everywhere in widget)
            const svgIcons = {
                refs: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`,
                film: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="2" width="20" height="20" rx="2.18" ry="2.18"></rect><line x1="7" y1="2" x2="7" y2="22"></line><line x1="17" y1="2" x2="17" y2="22"></line><line x1="2" y1="12" x2="22" y2="12"></line><line x1="2" y1="7" x2="7" y2="7"></line><line x1="2" y1="17" x2="7" y2="17"></line><line x1="17" y1="17" x2="22" y2="17"></line><line x1="17" y1="7" x2="22" y2="7"></line></svg>`,
                camera: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path><circle cx="12" cy="13" r="4"></circle></svg>`,
                color: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z"></path><circle cx="7.5" cy="10.5" r=".75" fill="currentColor"></circle><circle cx="12" cy="7.5" r=".75" fill="currentColor"></circle><circle cx="16.5" cy="10.5" r=".75" fill="currentColor"></circle></svg>`,
                light: `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line><circle cx="12" cy="12" r="5"></circle></svg>`,
                image: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>`,
                video: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="23 7 16 12 23 17 23 7"></polygon><rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect></svg>`,
                refresh: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`,
                folder: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`
            };

            // State variables
            let recentVideos = [];
            let recentImages = [];
            let isGeneratingImage = false;
            let currentMode = "Video (Minimax H3)";
            let updateChipsVisibilityForMode = null;
            let openImageEditModal = null;
            let currentEditSession = null;
            let syncOrBuildQwenImageEditPipeline = null;
            let filmSetup = "Auto";
            let camera = "Auto";
            let colorPalette = "Auto";
            let lighting = "Auto";
            let aspectRatio = "16:9";
            let resolution = "1080p";
            let duration = 5;
            let audio = "On";
            let variations = 1;

            const syncFromWidgets = () => {
                const wPrompt = getWidget("prompt");
                if (wPrompt && promptInput) promptInput.value = wPrompt.value || "";

                const wMode = getWidget("mode");
                if (wMode) currentMode = wMode.value;

                const wFilm = getWidget("film_setup");
                if (wFilm) filmSetup = wFilm.value;

                const wCam = getWidget("camera");
                if (wCam) camera = wCam.value;

                const wCol = getWidget("color_palette");
                if (wCol) colorPalette = wCol.value;

                const wLight = getWidget("lighting");
                if (wLight) lighting = wLight.value;

                const wRatio = getWidget("aspect_ratio");
                if (wRatio) aspectRatio = wRatio.value;

                const wRes = getWidget("resolution");
                if (wRes) resolution = wRes.value;

                const wDur = getWidget("duration");
                if (wDur) duration = wDur.value;

                const wAud = getWidget("audio");
                if (wAud) audio = wAud.value;

                const wVar = getWidget("variations");
                if (wVar) variations = wVar.value;
            };

            const setWidgetValue = (name, val) => {
                const w = getWidget(name);
                if (w) {
                    w.value = val;
                    if (w.callback) w.callback(val);
                }
            };

            // 1. TOP 3 VIDEOS CAROUSEL WITH DRAG & DROP
            const galleryWrapper = document.createElement("div");
            galleryWrapper.style.position = "relative";
            galleryWrapper.style.width = "100%";

            const galleryEl = document.createElement("div");
            galleryEl.className = "wox-top-gallery";

            // Action buttons on top right of the gallery (Column layout: Refresh on top, Open Folder below)
            const galleryActions = document.createElement("div");
            galleryActions.style.position = "absolute";
            galleryActions.style.top = "6px";
            galleryActions.style.right = "8px";
            galleryActions.style.zIndex = "10";
            galleryActions.style.display = "flex";
            galleryActions.style.flexDirection = "column";
            galleryActions.style.gap = "6px";
            galleryActions.style.alignItems = "center";

            // 1. Refresh button (top)
            const refreshBtn = document.createElement("button");
            refreshBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"></polyline><polyline points="1 20 1 14 7 14"></polyline><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path></svg>`;
            refreshBtn.title = "Aggiorna ultimi video";
            refreshBtn.style.background = "rgba(255,255,255,0.08)";
            refreshBtn.style.border = "1px solid rgba(255,255,255,0.18)";
            refreshBtn.style.color = "#cbd5e1";
            refreshBtn.style.borderRadius = "50%";
            refreshBtn.style.width = "24px";
            refreshBtn.style.height = "24px";
            refreshBtn.style.cursor = "pointer";
            refreshBtn.style.display = "flex";
            refreshBtn.style.alignItems = "center";
            refreshBtn.style.justifyContent = "center";
            refreshBtn.style.transition = "all 0.2s";
            refreshBtn.addEventListener("mouseenter", () => {
                refreshBtn.style.background = "rgba(255,255,255,0.25)";
                refreshBtn.style.borderColor = "#ffffff";
                refreshBtn.style.transform = "scale(1.1)";
            });
            refreshBtn.addEventListener("mouseleave", () => {
                refreshBtn.style.background = "rgba(255,255,255,0.08)";
                refreshBtn.style.borderColor = "rgba(255,255,255,0.18)";
                refreshBtn.style.transform = "scale(1)";
            });
            refreshBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                if (currentMode.includes("Image")) {
                    fetchRecentImages();
                } else {
                    fetchRecentVideos();
                }
                fetchReferences();
            });

            // 2. Open Folder button (below Refresh)
            const folderBtn = document.createElement("button");
            folderBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg>`;
            folderBtn.title = "Apri cartella dei file generati";
            folderBtn.style.background = "rgba(255,255,255,0.08)";
            folderBtn.style.border = "1px solid rgba(255,255,255,0.18)";
            folderBtn.style.color = "#cbd5e1";
            folderBtn.style.borderRadius = "50%";
            folderBtn.style.width = "24px";
            folderBtn.style.height = "24px";
            folderBtn.style.cursor = "pointer";
            folderBtn.style.display = "flex";
            folderBtn.style.alignItems = "center";
            folderBtn.style.justifyContent = "center";
            folderBtn.style.transition = "all 0.2s";
            folderBtn.addEventListener("mouseenter", () => {
                folderBtn.style.background = "rgba(212, 255, 50, 0.25)";
                folderBtn.style.borderColor = "#d4ff32";
                folderBtn.style.transform = "scale(1.1)";
            });
            folderBtn.addEventListener("mouseleave", () => {
                folderBtn.style.background = "rgba(255,255,255,0.08)";
                folderBtn.style.borderColor = "rgba(255,255,255,0.18)";
                folderBtn.style.transform = "scale(1)";
            });
            folderBtn.addEventListener("click", async (e) => {
                e.stopPropagation();
                try {
                    const res = await fetch("/wox_cinema/recent_videos?open_folder=1");
                    const data = await res.json();
                    if (!data.success && data.recent_videos && data.recent_videos.length > 0) {
                        window.open(data.recent_videos[0].url, "_blank");
                    }
                } catch (err) {
                    console.log("Apertura cartella output:", err);
                }
            });

            // 3. Open Media Gallery button (below Folder button)
            const mediaGalleryBtn = document.createElement("button");
            mediaGalleryBtn.innerHTML = `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`;
            mediaGalleryBtn.title = "Apri Media Gallery (Generazioni e Reference)";
            mediaGalleryBtn.style.background = "rgba(255,255,255,0.08)";
            mediaGalleryBtn.style.border = "1px solid rgba(255,255,255,0.18)";
            mediaGalleryBtn.style.color = "#cbd5e1";
            mediaGalleryBtn.style.borderRadius = "50%";
            mediaGalleryBtn.style.width = "24px";
            mediaGalleryBtn.style.height = "24px";
            mediaGalleryBtn.style.cursor = "pointer";
            mediaGalleryBtn.style.display = "flex";
            mediaGalleryBtn.style.alignItems = "center";
            mediaGalleryBtn.style.justifyContent = "center";
            mediaGalleryBtn.style.transition = "all 0.2s";
            mediaGalleryBtn.addEventListener("mouseenter", () => {
                mediaGalleryBtn.style.background = "rgba(212, 255, 50, 0.25)";
                mediaGalleryBtn.style.borderColor = "#d4ff32";
                mediaGalleryBtn.style.transform = "scale(1.1)";
            });
            mediaGalleryBtn.addEventListener("mouseleave", () => {
                mediaGalleryBtn.style.background = "rgba(255,255,255,0.08)";
                mediaGalleryBtn.style.borderColor = "rgba(255,255,255,0.18)";
                mediaGalleryBtn.style.transform = "scale(1)";
            });
            mediaGalleryBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                if (typeof openRefModal === "function") {
                    openRefModal("mention", "Generations");
                }
            });

            galleryActions.appendChild(refreshBtn);
            galleryActions.appendChild(folderBtn);
            galleryActions.appendChild(mediaGalleryBtn);

            // 4. Setup & System Installer button (Gear)
            const setupGearBtn = document.createElement("button");
            setupGearBtn.className = "wox-setup-btn";
            setupGearBtn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`;
            setupGearBtn.title = "Impostazioni e Installazione Moduli / Nodi";
            setupGearBtn.addEventListener("click", (e) => {
                e.stopPropagation();
                if (typeof openSetupModal === "function") {
                    openSetupModal();
                }
            });
            galleryActions.appendChild(setupGearBtn);

            galleryWrapper.appendChild(galleryActions);
            galleryWrapper.appendChild(galleryEl);

            const defaultPlaceholders = [
                { title: "ZEPHYR SPECIAL", tag: "MINIMAX H3 VIDEO", url: "", isDefault: true, bg: "linear-gradient(135deg, #1f2937, #111827)" },
                { title: "THE CULLY HILL BOYS", tag: "FIRST AI FEATURE FILM", url: "", isDefault: true, isCenter: true, bg: "linear-gradient(135deg, #374151, #030712)" },
                { title: "HELL GRIND", tag: "MINIMAX H3 VIDEO", url: "", isDefault: true, bg: "linear-gradient(135deg, #450a0a, #111827)" }
            ];

            const defaultImagePlaceholders = [
                { title: "CYBERPUNK NEON", tag: "Z-IMAGE TURBO", url: "", isDefault: true, bg: "linear-gradient(135deg, #1f2937, #111827)", media_type: "image" },
                { title: "CINEMATIC PORTRAIT", tag: "Z-IMAGE TURBO", url: "", isDefault: true, isCenter: true, bg: "linear-gradient(135deg, #374151, #030712)", media_type: "image" },
                { title: "NIGHT CITY 8K", tag: "Z-IMAGE TURBO", url: "", isDefault: true, bg: "linear-gradient(135deg, #14213d, #000000)", media_type: "image" }
            ];

            const renderGallery = () => {
                galleryEl.innerHTML = "";
                
                const isImgMode = currentMode.includes("Image");
                const sourceList = isImgMode ? recentImages : recentVideos;
                const placeholders = isImgMode ? defaultImagePlaceholders : defaultPlaceholders;
                
                let cardsToDisplay = [];
                if (sourceList.length >= 3) {
                    // Left = #2, Center = #1 (Latest), Right = #3
                    cardsToDisplay = [
                        { ...sourceList[1], slot: "left" },
                        { ...sourceList[0], slot: "center", isCenter: true },
                        { ...sourceList[2], slot: "right" }
                    ];
                } else if (sourceList.length === 2) {
                    cardsToDisplay = [
                        { ...sourceList[1], slot: "left" },
                        { ...sourceList[0], slot: "center", isCenter: true },
                        { ...placeholders[2], slot: "right" }
                    ];
                } else if (sourceList.length === 1) {
                    cardsToDisplay = [
                        { ...placeholders[0], slot: "left" },
                        { ...sourceList[0], slot: "center", isCenter: true },
                        { ...placeholders[2], slot: "right" }
                    ];
                } else {
                    cardsToDisplay = placeholders;
                }

                cardsToDisplay.forEach((card, idx) => {
                    const cardEl = document.createElement("div");
                    const isCenter = card.isCenter || idx === 1;
                    cardEl.className = `wox-card ${isCenter ? "center-card" : ""}`;
                    cardEl.draggable = true;
                    cardEl.title = card.filename ? `Trascina ${card.filename}` : (isImgMode ? "WOX Cinema Image (Z-Image Turbo)" : "WOX Cinema Video");

                    const isImg = isImgMode || card.media_type === "image" || (card.url && card.url.match(/\.(png|jpg|jpeg|webp)/i));

                    if (card.url) {
                        if (isImg) {
                            const img = document.createElement("img");
                            img.className = "wox-card-img";
                            const cacheParam = card.time ? `&_t=${card.time}` : `&_t=${Date.now()}`;
                            img.src = card.url + (card.url.includes("?") ? cacheParam : `?_t=${Date.now()}`);
                            cardEl.appendChild(img);

                            const overlay = document.createElement("div");
                            overlay.className = "wox-card-overlay";
                            overlay.innerHTML = `
                                <div class="wox-card-title">${card.name || "Z-IMAGE TURBO"}</div>
                                <div class="wox-card-tag">${card.tag || "Z-IMAGE TURBO • IMAGE"}</div>
                            `;
                            cardEl.appendChild(overlay);

                            // Cliccando sulla card dell'immagine si apre subito il Preview Lightbox
                            cardEl.style.cursor = "pointer";
                            cardEl.addEventListener("click", () => {
                                openImagePreviewModal({
                                    url: card.url,
                                    filename: card.filename || card.name,
                                    tag: card.tag || "@zimage_image",
                                    prompt: card.prompt || promptInput.value
                                });
                            });
                        } else {
                            const video = document.createElement("video");
                            video.setAttribute("autoplay", "");
                            video.setAttribute("loop", "");
                            video.setAttribute("muted", "");
                            video.setAttribute("playsinline", "");
                            video.muted = true;
                            video.defaultMuted = true;
                            video.playsInline = true;
                            video.loop = true;
                            video.autoplay = true;
                            video.preload = "auto";
                            video.style.position = "absolute";
                            video.style.top = "0";
                            video.style.left = "0";
                            video.style.width = "100%";
                            video.style.height = "100%";
                            video.style.objectFit = "cover";
                            video.style.borderRadius = "12px";
                            video.style.display = "block";
                            
                            const cacheParam = card.time ? `&_t=${card.time}` : `&_t=${Date.now()}`;
                            const vidUrl = card.url + (card.url.includes("?") ? cacheParam : `?_t=${Date.now()}`);
                            video.src = vidUrl + (vidUrl.includes("#") ? "" : "#t=0.001");
                            
                            const tryPlay = () => {
                                const p = video.play();
                                if (p && typeof p.catch === "function") p.catch(() => {});
                            };
                            video.onloadeddata = tryPlay;
                            video.oncanplay = tryPlay;
                            
                            cardEl.appendChild(video);
                            cardEl.addEventListener("mouseenter", tryPlay);

                            const overlay = document.createElement("div");
                            overlay.className = "wox-card-overlay";
                            overlay.innerHTML = `
                                <div class="wox-card-title">${card.name || "MINIMAX H3 VIDEO"}</div>
                                <div class="wox-card-tag">${card.tag || "MINIMAX H3 • VIDEO"}</div>
                            `;
                            cardEl.appendChild(overlay);

                            const playBadge = document.createElement("div");
                            playBadge.className = "wox-drag-badge";
                            playBadge.innerHTML = `▶ VIDEO`;
                            cardEl.appendChild(playBadge);

                            cardEl.style.cursor = "pointer";
                            cardEl.addEventListener("click", () => {
                                openImagePreviewModal({
                                    url: card.url,
                                    filename: card.filename || card.name,
                                    tag: card.tag || "@minimax_video",
                                    prompt: card.prompt || (promptInput ? promptInput.value : ""),
                                    media_type: "video"
                                });
                            });
                        }
                    } else {
                        // Generic Placeholder Thumbnail
                        cardEl.style.background = card.bg || "linear-gradient(135deg, #181c26 0%, #0d0f14 100%)";
                        cardEl.style.display = "flex";
                        cardEl.style.alignItems = "center";
                        cardEl.style.justifyContent = "center";
                        
                        const icon = document.createElement("div");
                        icon.style.opacity = "0.3";
                        icon.style.userSelect = "none";
                        icon.innerHTML = isImg ? svgIcons.image : svgIcons.video;
                        cardEl.appendChild(icon);
                    }

                    // Drag and drop event handlers
                    cardEl.addEventListener("dragstart", (e) => {
                        const targetUrl = card.url ? window.location.origin + card.url : "";
                        e.dataTransfer.setData("text/plain", targetUrl || card.title || "");
                        e.dataTransfer.setData("text/uri-list", targetUrl);
                        e.dataTransfer.setData("application/json", JSON.stringify({
                            type: isImg ? "wox_image" : "wox_video",
                            filename: card.filename || "",
                            url: targetUrl
                        }));
                        e.dataTransfer.effectAllowed = "copyMove";
                    });

                    galleryEl.appendChild(cardEl);
                });
            };

            const fetchRecentVideos = async () => {
                try {
                    let res = null;
                    const cacheBustUrl = `/wox_cinema/recent_videos?_t=${Date.now()}`;
                    try {
                        res = await fetch(cacheBustUrl, { cache: "no-store" });
                    } catch (e) {
                        res = await api.fetchApi(cacheBustUrl);
                    }
                    if (res && res.ok) {
                        const data = await res.json();
                        if (data && Array.isArray(data.recent_videos)) {
                            const newKey = data.recent_videos.map(v => `${v.filename}_${v.time}`).join("|");
                            const oldKey = recentVideos.map(v => `${v.filename}_${v.time}`).join("|");
                            const changed = newKey !== oldKey;
                            recentVideos = data.recent_videos;
                            if (changed && !currentMode.includes("Image")) {
                                renderGallery();
                            }
                        }
                    }
                } catch (e) {
                    console.log("WOX Cinema: recent videos fetch error", e);
                }
            };

            // Client-side persistent tombstone set to permanently prevent deleted items from flashing or reappearing
            const getDeletedRefs = () => {
                try {
                    return new Set(JSON.parse(localStorage.getItem("wox_cinema_deleted_refs") || "[]").map(s => String(s).toLowerCase()));
                } catch (e) {
                    return new Set();
                }
            };

            const addDeletedRef = (fn, raw) => {
                try {
                    const list = JSON.parse(localStorage.getItem("wox_cinema_deleted_refs") || "[]");
                    [fn, raw].forEach(item => {
                        if (item) {
                            const clean = String(item).toLowerCase().trim();
                            const base = clean.replace("woxcinema/", "");
                            if (clean && !list.includes(clean)) list.push(clean);
                            if (base && !list.includes(base)) list.push(base);
                        }
                    });
                    localStorage.setItem("wox_cinema_deleted_refs", JSON.stringify(list));
                } catch (e) {}
            };

            const removeDeletedRef = (fn) => {
                try {
                    const list = JSON.parse(localStorage.getItem("wox_cinema_deleted_refs") || "[]");
                    if (fn) {
                        const clean = String(fn).toLowerCase().trim();
                        const base = clean.replace("woxcinema/", "");
                        const filtered = list.filter(item => item !== clean && item !== base);
                        localStorage.setItem("wox_cinema_deleted_refs", JSON.stringify(filtered));
                    }
                } catch (e) {}
            };

            const fetchRecentImages = async () => {
                try {
                    let res = null;
                    const cacheBustUrl = `/wox_cinema/recent_images?_t=${Date.now()}`;
                    try {
                        res = await fetch(cacheBustUrl, { cache: "no-store" });
                    } catch (e) {
                        res = await api.fetchApi(cacheBustUrl);
                    }
                    if (res && res.ok) {
                        const data = await res.json();
                        if (data && Array.isArray(data.recent_images)) {
                            const deletedSet = getDeletedRefs();
                            const filtered = data.recent_images.filter(img => {
                                const fn = (img.filename || "").toLowerCase();
                                const name = (img.name || "").toLowerCase();
                                const base = fn.replace("woxcinema/", "");
                                return !deletedSet.has(fn) && !deletedSet.has(name) && !deletedSet.has(base);
                            });
                            const newKey = filtered.map(img => `${img.filename}_${img.time}`).join("|");
                            const oldKey = recentImages.map(img => `${img.filename}_${img.time}`).join("|");
                            const changed = newKey !== oldKey;
                            recentImages = filtered;
                            if (changed && currentMode.includes("Image")) {
                                renderGallery();
                            }
                        }
                    }
                } catch (e) {
                    console.log("WOX Cinema: recent images fetch error", e);
                }
            };

            renderGallery();
            fetchRecentVideos();
            fetchRecentImages();
            setTimeout(fetchRecentVideos, 400);
            setTimeout(fetchRecentImages, 400);
            setTimeout(fetchRecentVideos, 1500);
            setTimeout(fetchRecentImages, 1500);

            // Periodic auto-check every 3 seconds
            const autoRefreshTimer = setInterval(() => {
                if (currentMode.includes("Image")) {
                    fetchRecentImages();
                } else {
                    fetchRecentVideos();
                }
            }, 3000);

            node.onRemoved = () => {
                clearInterval(autoRefreshTimer);
            };

            // 2. MAIN TITLE
            const titleEl = document.createElement("div");
            titleEl.className = "wox-main-title";
            titleEl.innerText = "BRING YOUR STORIES TO LIFE";

            // 3. TOP PILLS BAR (References, Film Setup, Camera, Color, Lighting)
            const pillsBar = document.createElement("div");
            pillsBar.className = "wox-pills-bar";

            const createPill = (icon, label, initialValue, options, onChange, onClickOverride) => {
                const pill = document.createElement("div");
                pill.className = "wox-pill";
                
                const iconEl = document.createElement("div");
                iconEl.className = "wox-pill-icon";
                iconEl.innerHTML = icon;

                const contentEl = document.createElement("div");
                contentEl.className = "wox-pill-content";

                const labelEl = document.createElement("div");
                labelEl.className = "wox-pill-label";
                labelEl.innerText = label;

                const valEl = document.createElement("div");
                valEl.className = "wox-pill-value";
                valEl.innerText = initialValue;

                contentEl.appendChild(labelEl);
                contentEl.appendChild(valEl);
                pill.appendChild(iconEl);
                pill.appendChild(contentEl);

                pill.addEventListener("click", (e) => {
                    if (onClickOverride) {
                        onClickOverride(e);
                        return;
                    }
                    if (options && options.length > 0) {
                        const currIdx = options.indexOf(valEl.innerText);
                        const nextIdx = (currIdx + 1) % options.length;
                        const nextVal = options[nextIdx];
                        valEl.innerText = nextVal;
                        if (onChange) onChange(nextVal);
                    }
                });

                return {
                    pill,
                    updateVal: (v) => { valEl.innerText = v; },
                    updateIcon: (newIcon) => { iconEl.innerHTML = newIcon; }
                };
            };

            const getModalBackdrop = () => {
                let mb = document.querySelector(".wox-modal-backdrop");
                if (!mb) {
                    mb = document.createElement("div");
                    mb.className = "wox-modal-backdrop";
                    document.body.appendChild(mb);
                }
                return mb;
            };

            // Film Setup Cinematic Styles & Graphic Thumbnails
            const filmStylesData = [
                {
                    id: "General",
                    name: "General (35mm Standard)",
                    category: "cinema",
                    badge: "35MM STANDARD",
                    desc: "Fotografia cinematografica bilanciata 35mm, illuminazione naturale e grading premium da studio.",
                    svg: `<svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <radialGradient id="g-gen-lens" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stop-color="#1e293b"/>
                                <stop offset="60%" stop-color="#0f172a"/>
                                <stop offset="100%" stop-color="#020617"/>
                            </radialGradient>
                            <linearGradient id="g-gen-flare" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.6"/>
                                <stop offset="50%" stop-color="#d4ff32" stop-opacity="0.3"/>
                                <stop offset="100%" stop-color="#f59e0b" stop-opacity="0.6"/>
                            </linearGradient>
                        </defs>
                        <rect width="320" height="160" fill="#0b0f19"/>
                        <circle cx="260" cy="40" r="100" fill="#38bdf8" opacity="0.12"/>
                        <circle cx="60" cy="120" r="90" fill="#f59e0b" opacity="0.12"/>
                        <circle cx="160" cy="80" r="62" fill="url(#g-gen-lens)" stroke="rgba(255,255,255,0.15)" stroke-width="2"/>
                        <circle cx="160" cy="80" r="50" stroke="rgba(56,189,248,0.3)" stroke-width="1.5" stroke-dasharray="4 3"/>
                        <circle cx="160" cy="80" r="36" fill="#050811" stroke="rgba(212,255,50,0.4)" stroke-width="2"/>
                        <polygon points="160,48 184,72 176,92 144,92 136,72" fill="none" stroke="rgba(255,255,255,0.25)" stroke-width="1.5"/>
                        <circle cx="160" cy="80" r="14" fill="#020408" stroke="#d4ff32" stroke-width="2"/>
                        <path d="M40 80 Q160 70 280 80" stroke="url(#g-gen-flare)" stroke-width="2" stroke-linecap="round"/>
                        <ellipse cx="160" cy="80" rx="90" ry="12" stroke="rgba(56,189,248,0.2)" stroke-width="1" transform="rotate(-15 160 80)"/>
                        <ellipse cx="140" cy="74" rx="8" ry="4" fill="#ffffff" opacity="0.35" transform="rotate(-25 140 74)"/>
                        <circle cx="80" cy="45" r="3" fill="#38bdf8" opacity="0.4"/>
                        <circle cx="240" cy="110" r="4" fill="#f59e0b" opacity="0.4"/>
                        <circle cx="105" cy="130" r="2" fill="#d4ff32" opacity="0.5"/>
                    </svg>`
                },
                {
                    id: "Cinematic 35mm",
                    name: "Cinematic 35mm",
                    category: "cinema",
                    badge: "KODAK CELLULOID",
                    desc: "Pellicola Kodak 35mm, aloni organici caldi, grana autentica e profondità di campo naturale.",
                    svg: `<svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="g-35-amber" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stop-color="#451a03"/>
                                <stop offset="50%" stop-color="#b45309"/>
                                <stop offset="100%" stop-color="#78350f"/>
                            </linearGradient>
                            <linearGradient id="g-35-sun" x1="0%" y1="100%" x2="100%" y2="0%">
                                <stop offset="0%" stop-color="#f59e0b"/>
                                <stop offset="100%" stop-color="#ef4444"/>
                            </linearGradient>
                        </defs>
                        <rect width="320" height="160" fill="#1c0f06"/>
                        <rect x="15" y="10" width="290" height="140" rx="6" fill="#0f0703" stroke="#b45309" stroke-width="1.5"/>
                        <g fill="#1c0f06" stroke="rgba(245,158,11,0.4)" stroke-width="1">
                            <rect x="30" y="14" width="16" height="11" rx="2"/><rect x="60" y="14" width="16" height="11" rx="2"/><rect x="90" y="14" width="16" height="11" rx="2"/><rect x="120" y="14" width="16" height="11" rx="2"/><rect x="150" y="14" width="16" height="11" rx="2"/><rect x="180" y="14" width="16" height="11" rx="2"/><rect x="210" y="14" width="16" height="11" rx="2"/><rect x="240" y="14" width="16" height="11" rx="2"/><rect x="270" y="14" width="16" height="11" rx="2"/>
                            <rect x="30" y="135" width="16" height="11" rx="2"/><rect x="60" y="135" width="16" height="11" rx="2"/><rect x="90" y="135" width="16" height="11" rx="2"/><rect x="120" y="135" width="16" height="11" rx="2"/><rect x="150" y="135" width="16" height="11" rx="2"/><rect x="180" y="135" width="16" height="11" rx="2"/><rect x="210" y="135" width="16" height="11" rx="2"/><rect x="240" y="135" width="16" height="11" rx="2"/><rect x="270" y="135" width="16" height="11" rx="2"/>
                        </g>
                        <rect x="38" y="32" width="244" height="96" rx="4" fill="url(#g-35-amber)"/>
                        <circle cx="160" cy="72" r="30" fill="url(#g-35-sun)" opacity="0.9"/>
                        <path d="M38 128 L95 85 L145 110 L195 75 L250 115 L282 100 L282 128 Z" fill="#291205"/>
                        <path d="M38 128 L95 85 L145 110 L195 75 L250 115 L282 100" stroke="#fcd34d" stroke-width="2" opacity="0.6"/>
                        <text x="50" y="47" font-family="monospace" font-size="9" fill="#fcd34d" opacity="0.7">KODAK 5219 35MM</text>
                        <text x="220" y="47" font-family="monospace" font-size="9" fill="#fcd34d" opacity="0.7">24 FPS • 500T</text>
                    </svg>`
                },
                {
                    id: "IMAX 70mm",
                    name: "IMAX 70mm",
                    category: "cinema",
                    badge: "70MM PANAVISION",
                    desc: "Nitidezza estrema, gamma dinamica cinematografica sbalorditiva e grandiosa scala panoramica.",
                    svg: `<svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="g-imax-sky" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stop-color="#020617"/>
                                <stop offset="60%" stop-color="#0369a1"/>
                                <stop offset="100%" stop-color="#0284c7"/>
                            </linearGradient>
                        </defs>
                        <rect width="320" height="160" fill="#020617"/>
                        <rect x="10" y="16" width="300" height="128" rx="4" fill="url(#g-imax-sky)" stroke="rgba(56,189,248,0.4)" stroke-width="1.5"/>
                        <circle cx="50" cy="35" r="1.5" fill="#fff" opacity="0.8"/>
                        <circle cx="110" cy="28" r="1" fill="#fff" opacity="0.6"/>
                        <circle cx="180" cy="40" r="1.5" fill="#fff" opacity="0.9"/>
                        <circle cx="230" cy="25" r="1.2" fill="#fff" opacity="0.7"/>
                        <circle cx="280" cy="45" r="1" fill="#fff" opacity="0.5"/>
                        <path d="M10 144 L60 90 L110 115 L160 65 L220 110 L270 78 L310 120 L310 144 Z" fill="#0f172a"/>
                        <path d="M10 144 L90 105 L160 65 L240 102 L310 144 Z" fill="#090d16" opacity="0.6"/>
                        <line x1="10" y1="88" x2="310" y2="88" stroke="#38bdf8" stroke-width="2" opacity="0.8"/>
                        <ellipse cx="160" cy="88" rx="40" ry="4" fill="#bae6fd" opacity="0.8"/>
                        <text x="24" y="34" font-family="sans-serif" font-weight="900" font-size="11" fill="#38bdf8" letter-spacing="2">IMAX 70MM</text>
                        <text x="24" y="46" font-family="sans-serif" font-size="8" fill="#bae6fd" opacity="0.7">1.43:1 EXPANDED ASPECT RATIO</text>
                    </svg>`
                },
                {
                    id: "NOIR",
                    name: "NOIR",
                    category: "genre",
                    badge: "CHIAROSCURO B&W",
                    desc: "Ombre drammatiche, taglio di luce a veneziana, netto contrasto in bianco e nero e fumo di suspense.",
                    svg: `<svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="g-noir-slants" x1="0%" y1="0%" x2="100%" y2="80%">
                                <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9"/>
                                <stop offset="70%" stop-color="#94a3b8" stop-opacity="0.3"/>
                                <stop offset="100%" stop-color="#000000" stop-opacity="0"/>
                            </linearGradient>
                        </defs>
                        <rect width="320" height="160" fill="#000000"/>
                        <polygon points="10,10 220,5 280,18 20,25" fill="url(#g-noir-slants)"/>
                        <polygon points="10,35 230,28 290,42 20,50" fill="url(#g-noir-slants)"/>
                        <polygon points="10,60 240,52 300,66 20,75" fill="url(#g-noir-slants)"/>
                        <polygon points="10,85 250,76 310,90 20,100" fill="url(#g-noir-slants)"/>
                        <polygon points="10,110 260,100 315,114 20,125" fill="url(#g-noir-slants)"/>
                        <polygon points="10,135 270,124 318,138 20,150" fill="url(#g-noir-slants)"/>
                        <path d="M210 160 L205 125 C205 120 208 115 214 114 C218 108 220 102 222 96 C216 95 212 94 206 94 C204 90 206 82 224 80 C226 72 232 66 244 65 C256 66 262 72 264 80 C282 82 284 90 282 94 C276 94 272 95 266 96 C268 102 270 108 274 114 C280 115 283 120 283 125 L278 160 Z" fill="#000000" stroke="rgba(255,255,255,0.7)" stroke-width="1.5"/>
                        <path d="M236 106 Q232 94 240 85 T234 68 T242 50" stroke="#f1f5f9" stroke-width="1.5" fill="none" opacity="0.75"/>
                        <text x="24" y="32" font-family="serif" font-style="italic" font-size="16" fill="#ffffff" letter-spacing="3">FILM NOIR</text>
                        <text x="24" y="46" font-family="sans-serif" font-size="8" fill="#cbd5e1" letter-spacing="1">CHIAROSCURO & SHADOWS</text>
                    </svg>`
                },
                {
                    id: "Noir Classic",
                    name: "Noir Classic",
                    category: "genre",
                    badge: "1940s VINTAGE",
                    desc: "Classico Noir anni '40: cono di luce stradale sotto la pioggia, vicoli umidi e fascino poliziesco d'epoca.",
                    svg: `<svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <radialGradient id="g-noir-lamp" cx="50%" cy="20%" r="80%">
                                <stop offset="0%" stop-color="#ffffff" stop-opacity="0.85"/>
                                <stop offset="40%" stop-color="#94a3b8" stop-opacity="0.4"/>
                                <stop offset="100%" stop-color="#09090b" stop-opacity="0"/>
                            </radialGradient>
                        </defs>
                        <rect width="320" height="160" fill="#09090b"/>
                        <line x1="80" y1="20" x2="80" y2="160" stroke="#475569" stroke-width="3"/>
                        <path d="M70 24 Q80 15 90 24 L86 34 L74 34 Z" fill="#334155" stroke="#94a3b8" stroke-width="1"/>
                        <polygon points="80,34 10,160 210,160" fill="url(#g-noir-lamp)"/>
                        <g stroke="rgba(255,255,255,0.25)" stroke-width="1" stroke-linecap="round">
                            <line x1="40" y1="40" x2="32" y2="60"/><line x1="100" y1="50" x2="92" y2="70"/><line x1="150" y1="35" x2="142" y2="55"/><line x1="60" y1="80" x2="52" y2="100"/><line x1="120" y1="90" x2="112" y2="110"/><line x1="170" y1="75" x2="162" y2="95"/><line x1="90" y1="120" x2="82" y2="140"/><line x1="140" y1="125" x2="132" y2="145"/>
                        </g>
                        <ellipse cx="115" cy="154" rx="25" ry="5" fill="#000" opacity="0.7"/>
                        <path d="M104 155 L108 125 Q115 110 122 125 L126 155 Z" fill="#000"/>
                        <circle cx="115" cy="108" r="6" fill="#000"/>
                        <ellipse cx="115" cy="104" rx="10" ry="2.5" fill="#000"/>
                        <text x="210" y="34" font-family="serif" font-weight="700" font-size="12" fill="#e2e8f0" letter-spacing="2">1940s CLASSIC</text>
                        <text x="210" y="47" font-family="sans-serif" font-size="8" fill="#94a3b8">AUTHENTIC MONOCHROME</text>
                    </svg>`
                },
                {
                    id: "Action",
                    name: "Action",
                    category: "genre",
                    badge: "HIGH-OCTANE",
                    desc: "Blockbuster dinamico ad alta energia: contrasto teal & orange, bagliori anamorfici e tensione visiva.",
                    svg: `<svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="g-act-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stop-color="#083344"/>
                                <stop offset="45%" stop-color="#0f172a"/>
                                <stop offset="75%" stop-color="#431407"/>
                                <stop offset="100%" stop-color="#ea580c"/>
                            </linearGradient>
                            <linearGradient id="g-act-streak" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stop-color="#06b6d4"/>
                                <stop offset="50%" stop-color="#ffffff"/>
                                <stop offset="100%" stop-color="#f97316"/>
                            </linearGradient>
                        </defs>
                        <rect width="320" height="160" fill="url(#g-act-bg)"/>
                        <polygon points="60,0 90,0 30,160 0,160" fill="#06b6d4" opacity="0.35"/>
                        <polygon points="180,0 220,0 140,160 100,160" fill="#f97316" opacity="0.3"/>
                        <polygon points="260,0 310,0 230,160 180,160" fill="#ef4444" opacity="0.35"/>
                        <circle cx="250" cy="70" r="3" fill="#fdba74"/>
                        <circle cx="280" cy="110" r="2" fill="#fef08a"/>
                        <circle cx="210" cy="130" r="2.5" fill="#ea580c"/>
                        <circle cx="50" cy="40" r="2.5" fill="#67e8f9"/>
                        <line x1="0" y1="80" x2="320" y2="80" stroke="url(#g-act-streak)" stroke-width="3"/>
                        <ellipse cx="140" cy="80" rx="30" ry="6" fill="#ffffff" opacity="0.9"/>
                        <text x="24" y="34" font-family="sans-serif" font-weight="900" font-size="14" fill="#ffffff" letter-spacing="2">BLOCKBUSTER ACTION</text>
                        <text x="24" y="47" font-family="sans-serif" font-size="8" fill="#67e8f9" letter-spacing="1">TEAL & ORANGE • ANAMORPHIC FLARE</text>
                    </svg>`
                },
                {
                    id: "Horror",
                    name: "Horror",
                    category: "genre",
                    badge: "DARK SUSPENSE",
                    desc: "Toni scuri desaturati, nebbia volumetrica verde smeraldo, luna spettrale e atmosfera inquietante.",
                    svg: `<svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <radialGradient id="g-horr-moon" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stop-color="#ecfdf5"/>
                                <stop offset="70%" stop-color="#6ee7b7"/>
                                <stop offset="100%" stop-color="#022c22" stop-opacity="0"/>
                            </radialGradient>
                        </defs>
                        <rect width="320" height="160" fill="#020817"/>
                        <circle cx="160" cy="65" r="55" fill="url(#g-horr-moon)" opacity="0.5"/>
                        <circle cx="160" cy="65" r="28" fill="#d1fae5" stroke="#a7f3d0" stroke-width="2"/>
                        <path d="M0 160 Q60 120 110 80 Q140 60 135 30 M110 80 Q130 95 155 85 M135 30 Q120 15 110 20 M135 30 Q145 20 160 22" stroke="#000" stroke-width="3.5" fill="none"/>
                        <path d="M320 160 Q260 110 210 75 Q180 55 185 25 M210 75 Q190 90 170 82 M185 25 Q195 15 205 18 M185 25 Q175 18 165 20" stroke="#000" stroke-width="3.5" fill="none"/>
                        <ellipse cx="160" cy="150" rx="170" ry="30" fill="#064e3b" opacity="0.6"/>
                        <ellipse cx="100" cy="140" rx="120" ry="20" fill="#047857" opacity="0.3"/>
                        <ellipse cx="220" cy="145" rx="110" ry="22" fill="#022c22" opacity="0.5"/>
                        <text x="24" y="32" font-family="serif" font-weight="700" font-size="14" fill="#a7f3d0" letter-spacing="3">HORROR & SUSPENSE</text>
                        <text x="24" y="45" font-family="sans-serif" font-size="8" fill="#6ee7b7" opacity="0.8">DARK DESATURATED • EERIE MIST</text>
                    </svg>`
                },
                {
                    id: "Comedy",
                    name: "Comedy",
                    category: "genre",
                    badge: "HIGH-KEY VIBRANT",
                    desc: "Luce da studio chiara e brillante, colori gioiosi saturi e ciak solare da commedia luminosa.",
                    svg: `<svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="g-com-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stop-color="#fbbf24"/>
                                <stop offset="50%" stop-color="#f43f5e"/>
                                <stop offset="100%" stop-color="#38bdf8"/>
                            </linearGradient>
                        </defs>
                        <rect width="320" height="160" fill="url(#g-com-bg)"/>
                        <g transform="translate(110, 40) rotate(-6)">
                            <rect x="0" y="22" width="100" height="65" rx="5" fill="#0f172a" stroke="#fff" stroke-width="2"/>
                            <rect x="0" y="0" width="100" height="20" rx="4" fill="#0f172a" stroke="#fff" stroke-width="2"/>
                            <polygon points="12,0 26,0 16,20 2,20" fill="#ffffff"/>
                            <polygon points="36,0 50,0 40,20 26,20" fill="#ffffff"/>
                            <polygon points="60,0 74,0 64,20 50,20" fill="#ffffff"/>
                            <polygon points="84,0 98,0 88,20 74,20" fill="#ffffff"/>
                            <text x="12" y="44" font-family="sans-serif" font-weight="900" font-size="11" fill="#fbbf24">SCENE 1</text>
                            <text x="12" y="60" font-family="sans-serif" font-weight="700" font-size="8" fill="#ffffff">TAKE 1 • ROLL A</text>
                        </g>
                        <circle cx="50" cy="40" r="14" fill="#ffffff" opacity="0.3"/>
                        <circle cx="270" cy="110" r="18" fill="#ffffff" opacity="0.35"/>
                        <polygon points="50,26 53,37 64,40 53,43 50,54 47,43 36,40 47,37" fill="#ffffff"/>
                        <polygon points="270,95 273,107 285,110 273,113 270,125 267,113 255,110 267,107" fill="#ffffff"/>
                        <text x="24" y="142" font-family="sans-serif" font-weight="900" font-size="12" fill="#0f172a" letter-spacing="1">COMEDY CINEMA</text>
                    </svg>`
                },
                {
                    id: "Epic",
                    name: "Epic",
                    category: "genre",
                    badge: "HEROIC SCALE",
                    desc: "Vette maestose illuminate da raggi di luce aurea, orizzonti infiniti e proporzioni mitiche.",
                    svg: `<svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="g-epic-sky" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stop-color="#451a03"/>
                                <stop offset="50%" stop-color="#b45309"/>
                                <stop offset="100%" stop-color="#f59e0b"/>
                            </linearGradient>
                        </defs>
                        <rect width="320" height="160" fill="url(#g-epic-sky)"/>
                        <g stroke="#fef08a" stroke-width="2.5" opacity="0.4">
                            <line x1="160" y1="80" x2="30" y2="0"/><line x1="160" y1="80" x2="80" y2="0"/><line x1="160" y1="80" x2="140" y2="0"/><line x1="160" y1="80" x2="180" y2="0"/><line x1="160" y1="80" x2="240" y2="0"/><line x1="160" y1="80" x2="290" y2="0"/>
                        </g>
                        <circle cx="160" cy="80" r="32" fill="#fef08a" opacity="0.9"/>
                        <path d="M0 160 L50 110 L100 135 L160 85 L220 130 L280 95 L320 125 L320 160 Z" fill="#1c0a02"/>
                        <polygon points="60,160 85,95 105,160" fill="#0a0401"/>
                        <circle cx="85" cy="88" r="3" fill="#0a0401"/>
                        <text x="24" y="32" font-family="serif" font-weight="900" font-size="14" fill="#ffffff" letter-spacing="3">EPIC CINEMATOGRAPHY</text>
                        <text x="24" y="45" font-family="sans-serif" font-size="8" fill="#fef08a">SWEEPING SCOPE • MAJESTIC LIGHT</text>
                    </svg>`
                },
                {
                    id: "Drama",
                    name: "Drama",
                    category: "genre",
                    badge: "EMOTIONAL BOKEH",
                    desc: "Profondità di campo morbida con cerchi di bokeh poetici, luce intima naturale e focus sul personaggio.",
                    svg: `<svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <radialGradient id="g-dram-bg" cx="40%" cy="50%" r="60%">
                                <stop offset="0%" stop-color="#4c0519"/>
                                <stop offset="70%" stop-color="#1f1124"/>
                                <stop offset="100%" stop-color="#0b080f"/>
                            </radialGradient>
                        </defs>
                        <rect width="320" height="160" fill="url(#g-dram-bg)"/>
                        <circle cx="70" cy="50" r="28" fill="#f59e0b" opacity="0.25"/>
                        <circle cx="120" cy="90" r="38" fill="#fb7185" opacity="0.2"/>
                        <circle cx="230" cy="40" r="32" fill="#ec4899" opacity="0.25"/>
                        <circle cx="270" cy="110" r="45" fill="#f59e0b" opacity="0.22"/>
                        <circle cx="180" cy="120" r="24" fill="#a855f7" opacity="0.28"/>
                        <circle cx="50" cy="120" r="20" fill="#fbbf24" opacity="0.3"/>
                        <path d="M155 160 C155 140 160 125 168 115 C176 105 182 98 180 88 C178 78 170 75 168 62 C178 60 185 68 188 78 C192 78 196 82 195 86 C190 92 188 95 194 98 C190 106 182 115 180 160 Z" fill="#000" opacity="0.8" stroke="rgba(251,191,36,0.5)" stroke-width="1.5"/>
                        <text x="24" y="32" font-family="serif" font-style="italic" font-size="14" fill="#fbcfe8" letter-spacing="2">INTIMATE DRAMA</text>
                        <text x="24" y="45" font-family="sans-serif" font-size="8" fill="#f472b6">SHALLOW FOCUS • ORGANIC GRAIN</text>
                    </svg>`
                },
                {
                    id: "Vintage Super 8",
                    name: "Vintage Super 8",
                    category: "art",
                    badge: "RETRO 1970s",
                    desc: "Cornice ad angoli arrotondati 8mm, aloni di luce caldi e grana nostalgica da filmino vintage.",
                    svg: `<svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="g-s8-leak" x1="0%" y1="0%" x2="50%" y2="80%">
                                <stop offset="0%" stop-color="#ea580c" stop-opacity="0.9"/>
                                <stop offset="50%" stop-color="#f59e0b" stop-opacity="0.5"/>
                                <stop offset="100%" stop-color="#78350f" stop-opacity="0"/>
                            </linearGradient>
                        </defs>
                        <rect width="320" height="160" fill="#000000"/>
                        <rect x="25" y="15" width="270" height="130" rx="20" fill="#451a03" stroke="#78350f" stroke-width="3"/>
                        <ellipse cx="40" cy="20" rx="90" ry="70" fill="url(#g-s8-leak)"/>
                        <circle cx="160" cy="70" r="28" fill="#fbbf24" opacity="0.8"/>
                        <path d="M25 145 Q100 95 180 120 T295 110 L295 145 Z" fill="#291205"/>
                        <line x1="195" y1="15" x2="197" y2="145" stroke="#fcd34d" stroke-width="1" opacity="0.55"/>
                        <text x="210" y="36" font-family="monospace" font-size="10" fill="#fcd34d">SUPER 8</text>
                        <text x="210" y="48" font-family="monospace" font-size="8" fill="#fcd34d" opacity="0.8">18 FPS RETRO</text>
                    </svg>`
                },
                {
                    id: "Anime Style",
                    name: "Anime Style",
                    category: "art",
                    badge: "MAKOTO SHINKAI",
                    desc: "Cieli al tramonto radiosi, nuvole volumetriche con bordi luminosi e stelle scintillanti stile anime.",
                    svg: `<svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="g-ani-sky" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stop-color="#1e1b4b"/>
                                <stop offset="40%" stop-color="#6b21a8"/>
                                <stop offset="70%" stop-color="#db2777"/>
                                <stop offset="100%" stop-color="#fb923c"/>
                            </linearGradient>
                        </defs>
                        <rect width="320" height="160" fill="url(#g-ani-sky)"/>
                        <g fill="#ffffff" opacity="0.85">
                            <circle cx="120" cy="115" r="30"/>
                            <circle cx="155" cy="100" r="38"/>
                            <circle cx="195" cy="105" r="32"/>
                            <circle cx="230" cy="120" r="26"/>
                            <rect x="90" y="115" width="160" height="35"/>
                        </g>
                        <g fill="#f472b6" opacity="0.6">
                            <circle cx="155" cy="106" r="34"/>
                            <circle cx="195" cy="112" r="28"/>
                        </g>
                        <polygon points="70,30 73,38 82,40 73,42 70,50 67,42 58,40 67,38" fill="#fef08a"/>
                        <polygon points="250,55 252,60 258,62 252,64 250,70 248,64 242,62 248,60" fill="#ffffff"/>
                        <circle cx="160" cy="45" r="1.5" fill="#ffffff"/>
                        <circle cx="210" cy="30" r="2" fill="#ffffff"/>
                        <line x1="280" y1="20" x2="210" y2="50" stroke="#fef08a" stroke-width="1.5" stroke-linecap="round" opacity="0.8"/>
                        <text x="24" y="32" font-family="sans-serif" font-weight="900" font-size="13" fill="#ffffff" letter-spacing="2">ANIME STYLE</text>
                        <text x="24" y="44" font-family="sans-serif" font-size="8" fill="#fed7aa">MAKOTO SHINKAI AESTHETIC</text>
                    </svg>`
                },
                {
                    id: "Hyperrealistic 8k",
                    name: "Hyperrealistic 8k",
                    category: "cinema",
                    badge: "8K ULTRA-HD",
                    desc: "Griglia ottica ciano ad altissima definizione, resa fotorealistica e micro-dettagli scolpiti.",
                    svg: `<svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <radialGradient id="g-8k-core" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stop-color="#0891b2" stop-opacity="0.3"/>
                                <stop offset="100%" stop-color="#040812" stop-opacity="0"/>
                            </radialGradient>
                        </defs>
                        <rect width="320" height="160" fill="#040812"/>
                        <g stroke="rgba(6,182,212,0.18)" stroke-width="1">
                            <line x1="0" y1="40" x2="320" y2="40"/><line x1="0" y1="80" x2="320" y2="80"/><line x1="0" y1="120" x2="320" y2="120"/>
                            <line x1="80" y1="0" x2="80" y2="160"/><line x1="160" y1="0" x2="160" y2="160"/><line x1="240" y1="0" x2="240" y2="160"/>
                        </g>
                        <circle cx="160" cy="80" r="50" fill="url(#g-8k-core)"/>
                        <circle cx="160" cy="80" r="45" stroke="#06b6d4" stroke-width="1.5" stroke-dasharray="8 4"/>
                        <circle cx="160" cy="80" r="28" stroke="#d4ff32" stroke-width="1.5"/>
                        <line x1="160" y1="25" x2="160" y2="45" stroke="#06b6d4" stroke-width="2"/>
                        <line x1="160" y1="115" x2="160" y2="135" stroke="#06b6d4" stroke-width="2"/>
                        <line x1="105" y1="80" x2="125" y2="80" stroke="#06b6d4" stroke-width="2"/>
                        <line x1="195" y1="80" x2="215" y2="80" stroke="#06b6d4" stroke-width="2"/>
                        <path d="M20 30 L20 20 L30 20" stroke="#06b6d4" stroke-width="2" fill="none"/>
                        <path d="M300 30 L300 20 L290 20" stroke="#06b6d4" stroke-width="2" fill="none"/>
                        <path d="M20 130 L20 140 L30 140" stroke="#06b6d4" stroke-width="2" fill="none"/>
                        <path d="M300 130 L300 140 L290 140" stroke="#06b6d4" stroke-width="2" fill="none"/>
                        <text x="36" y="32" font-family="monospace" font-weight="900" font-size="12" fill="#d4ff32">8K RESOLUTION</text>
                        <text x="36" y="44" font-family="monospace" font-size="8" fill="#67e8f9">7680x4320 • RAZOR SHARP</text>
                    </svg>`
                },
                {
                    id: "Auto",
                    name: "Auto (Intelligent)",
                    category: "art",
                    badge: "SMART AI",
                    desc: "Look dinamico intelligente: adatta stile, formato e atmosfera cinematografica leggendo il tuo prompt.",
                    svg: `<svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="g-auto-wave" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stop-color="#38bdf8"/>
                                <stop offset="35%" stop-color="#d4ff32"/>
                                <stop offset="70%" stop-color="#f43f5e"/>
                                <stop offset="100%" stop-color="#a855f7"/>
                            </linearGradient>
                        </defs>
                        <rect width="320" height="160" fill="#0b0d14"/>
                        <path d="M0 80 Q80 40 160 80 T320 80" stroke="url(#g-auto-wave)" stroke-width="4" fill="none"/>
                        <path d="M0 80 Q80 120 160 80 T320 80" stroke="url(#g-auto-wave)" stroke-width="2" fill="none" opacity="0.6"/>
                        <circle cx="80" cy="60" r="5" fill="#38bdf8" stroke="#fff" stroke-width="1.5"/>
                        <circle cx="160" cy="80" r="8" fill="#d4ff32" stroke="#0b0d14" stroke-width="2"/>
                        <circle cx="240" cy="100" r="5" fill="#f43f5e" stroke="#fff" stroke-width="1.5"/>
                        <polygon points="160,35 163,45 174,48 163,51 160,62 157,51 146,48 157,45" fill="#d4ff32"/>
                        <text x="24" y="32" font-family="sans-serif" font-weight="900" font-size="13" fill="#ffffff" letter-spacing="2">AUTO (INTELLIGENT)</text>
                        <text x="24" y="44" font-family="sans-serif" font-size="8" fill="#d4ff32">SMART PROMPT-BASED CINEMA STYLE</text>
                    </svg>`
                }
            ];

            const getFilmThumbSvg = (styleId) => {
                const found = filmStylesData.find(s => s.id.toLowerCase() === (styleId || "").toLowerCase());
                if (found && found.svg) {
                    return `<div class="wox-pill-thumb">${found.svg}</div>`;
                }
                return svgIcons.film;
            };

            const openFilmModal = () => {
                const backdrop = getModalBackdrop();
                let activeCategory = "all";
                let searchQuery = "";

                const renderFilmGrid = () => {
                    const grid = backdrop.querySelector("#wox-film-grid-container");
                    if (!grid) return;
                    grid.innerHTML = "";

                    const filtered = filmStylesData.filter(style => {
                        const matchesCat = activeCategory === "all" || style.category === activeCategory;
                        const query = searchQuery.trim().toLowerCase();
                        const matchesQuery = !query || 
                            style.name.toLowerCase().includes(query) ||
                            style.id.toLowerCase().includes(query) ||
                            style.badge.toLowerCase().includes(query) ||
                            style.desc.toLowerCase().includes(query);
                        return matchesCat && matchesQuery;
                    });

                    if (filtered.length === 0) {
                        grid.innerHTML = `
                            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #64748b;">
                                <div style="font-size: 28px; margin-bottom: 8px;">🎬</div>
                                <div style="font-size: 14px; font-weight: 700; color: #94a3b8;">Nessun stile trovato</div>
                                <div style="font-size: 12px; margin-top: 4px;">Prova con un altro termine di ricerca o seleziona "Tutti".</div>
                            </div>
                        `;
                        return;
                    }

                    filtered.forEach(style => {
                        const isSelected = (filmSetup === style.id);
                        const card = document.createElement("div");
                        card.className = `wox-film-card ${isSelected ? "selected" : ""}`;
                        card.dataset.styleId = style.id;

                        card.innerHTML = `
                            <div class="wox-film-thumb">
                                ${style.svg}
                                <span class="wox-film-tag-badge">${style.badge}</span>
                                <span class="wox-film-check-badge">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    ATTIVO
                                </span>
                            </div>
                            <div class="wox-film-card-info">
                                <div class="wox-film-card-title">
                                    <span>${style.name}</span>
                                </div>
                                <div class="wox-film-card-desc">${style.desc}</div>
                            </div>
                        `;

                        card.addEventListener("click", () => {
                            filmSetup = style.id;
                            pillFilm.updateVal(style.id);
                            if (pillFilm.updateIcon) {
                                pillFilm.updateIcon(getFilmThumbSvg(style.id));
                            }
                            setWidgetValue("film_setup", style.id);
                            if (app.graph && app.graph.setDirtyCanvas) {
                                app.graph.setDirtyCanvas(true, true);
                            }
                            
                            // Visual feedback
                            backdrop.querySelectorAll(".wox-film-card").forEach(c => c.classList.remove("selected"));
                            card.classList.add("selected");
                            
                            const currBadge = backdrop.querySelector("#wox-curr-film-name");
                            if (currBadge) currBadge.innerText = style.id;

                            // Smooth close
                            setTimeout(() => {
                                backdrop.classList.remove("open");
                            }, 140);
                        });

                        grid.appendChild(card);
                    });
                };

                backdrop.innerHTML = `
                    <div class="wox-film-modal">
                        <div class="wox-film-header">
                            <div class="wox-film-header-left">
                                <div class="wox-film-header-icon">
                                    ${svgIcons.film}
                                </div>
                                <div>
                                    <div class="wox-film-header-title">FILM SETUP - GALLERIA STILI CINEMATOGRAFICI</div>
                                    <div class="wox-film-header-subtitle">Seleziona il look visivo e la pellicola per orientare la generazione AI</div>
                                </div>
                            </div>
                            <div class="wox-film-header-right">
                                <div class="wox-film-current-badge">
                                    <span>Stile attivo:</span>
                                    <strong id="wox-curr-film-name">${filmSetup || "General"}</strong>
                                </div>
                                <button class="wox-modal-close" title="Chiudi (Esc)">✕</button>
                            </div>
                        </div>

                        <div class="wox-film-subbar">
                            <div class="wox-film-tabs">
                                <button class="wox-film-tab active" data-cat="all">Tutti (${filmStylesData.length})</button>
                                <button class="wox-film-tab" data-cat="cinema">Formati Cinema</button>
                                <button class="wox-film-tab" data-cat="genre">Generi Cinematografici</button>
                                <button class="wox-film-tab" data-cat="art">Stili Artistici & Retrò</button>
                            </div>
                            <div class="wox-film-search-wrap">
                                <span class="wox-film-search-icon">🔍</span>
                                <input type="text" class="wox-film-search-input" id="wox-film-search" placeholder="Cerca stile (es. noir, 35mm, anime)..." />
                            </div>
                        </div>

                        <div class="wox-film-body">
                            <div class="wox-film-grid" id="wox-film-grid-container"></div>
                        </div>
                    </div>
                `;

                // Event Listeners
                const closeBtn = backdrop.querySelector(".wox-modal-close");
                if (closeBtn) {
                    closeBtn.addEventListener("click", () => backdrop.classList.remove("open"));
                }
                backdrop.onclick = (e) => {
                    if (e.target === backdrop) backdrop.classList.remove("open");
                };

                const tabs = backdrop.querySelectorAll(".wox-film-tab");
                tabs.forEach(tab => {
                    tab.addEventListener("click", () => {
                        tabs.forEach(t => t.classList.remove("active"));
                        tab.classList.add("active");
                        activeCategory = tab.dataset.cat;
                        renderFilmGrid();
                    });
                });

                const searchInput = backdrop.querySelector("#wox-film-search");
                if (searchInput) {
                    searchInput.addEventListener("input", (e) => {
                        searchQuery = e.target.value;
                        renderFilmGrid();
                    });
                    setTimeout(() => searchInput.focus(), 100);
                }

                renderFilmGrid();
                backdrop.classList.add("open");
            };

            // Camera Movements & Graphic Thumbnails
            const cameraStylesData = [
                {
                    id: "Auto",
                    name: "Auto (Intelligent)",
                    category: "auto",
                    badge: "AI DIRECTOR",
                    desc: "La cinepresa adatta dinamicamente movimento, inclinazione e ritmo in base all'azione del prompt.",
                    svg: `<svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="320" height="160" fill="#0b0d14"/>
                        <circle cx="160" cy="80" r="50" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.5"/>
                        <circle cx="160" cy="80" r="30" stroke="#d4ff32" stroke-width="2"/>
                        <circle cx="160" cy="80" r="10" fill="#d4ff32"/>
                        <path d="M70 80 H110 M210 80 H250 M160 30 V50 M160 110 V130" stroke="#38bdf8" stroke-width="2" stroke-linecap="round"/>
                        <polygon points="110,80 102,74 102,86" fill="#38bdf8"/>
                        <polygon points="210,80 218,74 218,86" fill="#38bdf8"/>
                        <text x="24" y="32" font-family="sans-serif" font-weight="900" font-size="13" fill="#ffffff" letter-spacing="2">AUTO CAMERA</text>
                        <text x="24" y="44" font-family="sans-serif" font-size="8" fill="#d4ff32">SMART ADAPTIVE CINEMATOGRAPHY</text>
                    </svg>`
                },
                {
                    id: "Static Tripod",
                    name: "Static Tripod",
                    category: "standard",
                    badge: "LOCKED-OFF",
                    desc: "Inquadratura fissa su cavalletto da cinema, massima stabilità compositiva e zero oscillazioni.",
                    svg: `<svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="320" height="160" fill="#080c14"/>
                        <line x1="160" y1="65" x2="90" y2="145" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/>
                        <line x1="160" y1="65" x2="230" y2="145" stroke="#94a3b8" stroke-width="3" stroke-linecap="round"/>
                        <line x1="160" y1="65" x2="160" y2="145" stroke="#64748b" stroke-width="2" stroke-linecap="round"/>
                        <line x1="115" y1="115" x2="205" y2="115" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="4 2"/>
                        <rect x="135" y="45" width="50" height="22" rx="4" fill="#1e293b" stroke="#d4ff32" stroke-width="2"/>
                        <circle cx="150" cy="56" r="6" fill="#d4ff32"/>
                        <rect x="185" y="49" width="14" height="14" rx="2" fill="#38bdf8"/>
                        <text x="24" y="32" font-family="sans-serif" font-weight="900" font-size="13" fill="#ffffff" letter-spacing="2">STATIC TRIPOD</text>
                        <text x="24" y="44" font-family="sans-serif" font-size="8" fill="#94a3b8">ROCK SOLID • ZERO MOVEMENT</text>
                    </svg>`
                },
                {
                    id: "Pan Left to Right",
                    name: "Pan Left to Right",
                    category: "standard",
                    badge: "HORIZONTAL PAN",
                    desc: "Panoramica orizzontale fluida da sinistra a destra per esplorare l'ambiente e rivelare i soggetti.",
                    svg: `<svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="320" height="160" fill="#080e1a"/>
                        <path d="M50 85 H250" stroke="#38bdf8" stroke-width="4" stroke-linecap="round"/>
                        <path d="M50 75 H250" stroke="#d4ff32" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.7"/>
                        <polygon points="265,85 245,75 245,95" fill="#38bdf8"/>
                        <circle cx="160" cy="85" r="24" fill="#0f172a" stroke="#d4ff32" stroke-width="2"/>
                        <circle cx="160" cy="85" r="10" fill="#38bdf8"/>
                        <text x="24" y="32" font-family="sans-serif" font-weight="900" font-size="13" fill="#ffffff" letter-spacing="2">PAN LEFT TO RIGHT</text>
                        <text x="24" y="44" font-family="sans-serif" font-size="8" fill="#38bdf8">FLUID HORIZONTAL MOVEMENT</text>
                    </svg>`
                },
                {
                    id: "Tilt Up",
                    name: "Tilt Up",
                    category: "standard",
                    badge: "VERTICAL TILT",
                    desc: "Rotazione verticale dal basso verso l'alto per accentuare altezza, maestosità o imprevisti in cielo.",
                    svg: `<svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="320" height="160" fill="#0c0914"/>
                        <path d="M160 135 V45" stroke="#a855f7" stroke-width="4" stroke-linecap="round"/>
                        <path d="M150 135 V45" stroke="#d4ff32" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.7"/>
                        <polygon points="160,30 150,50 170,50" fill="#a855f7"/>
                        <circle cx="160" cy="95" r="22" fill="#1e1b4b" stroke="#d4ff32" stroke-width="2"/>
                        <circle cx="160" cy="95" r="8" fill="#a855f7"/>
                        <text x="24" y="32" font-family="sans-serif" font-weight="900" font-size="13" fill="#ffffff" letter-spacing="2">TILT UP</text>
                        <text x="24" y="44" font-family="sans-serif" font-size="8" fill="#c084fc">RISING PERSPECTIVE • VERTICAL DRAMA</text>
                    </svg>`
                },
                {
                    id: "Slow Zoom In",
                    name: "Slow Zoom In",
                    category: "dynamic",
                    badge: "PUSH IN",
                    desc: "Avvicinamento lento e progressivo al soggetto per intensificare la tensione emotiva e il fuoco psicologico.",
                    svg: `<svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="320" height="160" fill="#040d12"/>
                        <rect x="70" y="30" width="180" height="100" rx="10" stroke="#64748b" stroke-width="1.5" stroke-dasharray="6 4"/>
                        <rect x="105" y="48" width="110" height="64" rx="8" stroke="#38bdf8" stroke-width="2"/>
                        <rect x="135" y="64" width="50" height="32" rx="4" fill="#0f172a" stroke="#d4ff32" stroke-width="2"/>
                        <line x1="80" y1="36" x2="135" y2="64" stroke="#d4ff32" stroke-width="1.5"/>
                        <line x1="240" y1="36" x2="185" y2="64" stroke="#d4ff32" stroke-width="1.5"/>
                        <line x1="80" y1="124" x2="135" y2="96" stroke="#d4ff32" stroke-width="1.5"/>
                        <line x1="240" y1="124" x2="185" y2="96" stroke="#d4ff32" stroke-width="1.5"/>
                        <text x="24" y="32" font-family="sans-serif" font-weight="900" font-size="13" fill="#ffffff" letter-spacing="2">SLOW ZOOM IN</text>
                        <text x="24" y="44" font-family="sans-serif" font-size="8" fill="#d4ff32">EMOTIONAL INTENSITY • PUSH-IN</text>
                    </svg>`
                },
                {
                    id: "Drone FPV",
                    name: "Drone FPV",
                    category: "dynamic",
                    badge: "AERIAL ACROBATIC",
                    desc: "Volo aereo acrobatico ad alta velocità, picchiate vertiginose e angoli impossibili ad alta adrenalina.",
                    svg: `<svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="320" height="160" fill="#080d1a"/>
                        <path d="M40 120 Q120 20 200 110 T300 40" stroke="#f43f5e" stroke-width="3" stroke-linecap="round" fill="none"/>
                        <polygon points="305,37 290,38 297,50" fill="#f43f5e"/>
                        <ellipse cx="200" cy="110" rx="35" ry="12" stroke="#38bdf8" stroke-width="2" transform="rotate(-20 200 110)"/>
                        <circle cx="200" cy="110" r="7" fill="#d4ff32"/>
                        <line x1="175" y1="118" x2="155" y2="125" stroke="#94a3b8" stroke-width="2"/>
                        <line x1="225" y1="102" x2="245" y2="95" stroke="#94a3b8" stroke-width="2"/>
                        <text x="24" y="32" font-family="sans-serif" font-weight="900" font-size="13" fill="#ffffff" letter-spacing="2">DRONE FPV</text>
                        <text x="24" y="44" font-family="sans-serif" font-size="8" fill="#f43f5e">AERIAL SWOOP • HIGH DYNAMICS</text>
                    </svg>`
                },
                {
                    id: "360 Orbit",
                    name: "360 Orbit",
                    category: "dynamic",
                    badge: "BULLET TIME / ORBIT",
                    desc: "Rotazione circolare a 360 gradi intorno al centro della scena che isola ed esalta il soggetto.",
                    svg: `<svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="320" height="160" fill="#090a14"/>
                        <ellipse cx="160" cy="85" rx="90" ry="35" stroke="#38bdf8" stroke-width="2.5" stroke-dasharray="10 5" fill="none"/>
                        <polygon points="255,85 245,75 245,95" fill="#38bdf8"/>
                        <circle cx="160" cy="85" r="16" fill="#d4ff32" stroke="#fff" stroke-width="2"/>
                        <circle cx="75" cy="85" r="8" fill="#f43f5e" stroke="#fff" stroke-width="1.5"/>
                        <circle cx="245" cy="85" r="8" fill="#38bdf8" stroke="#fff" stroke-width="1.5"/>
                        <text x="24" y="32" font-family="sans-serif" font-weight="900" font-size="13" fill="#ffffff" letter-spacing="2">360 ORBIT</text>
                        <text x="24" y="44" font-family="sans-serif" font-size="8" fill="#38bdf8">360° CIRCULAR SURROUND</text>
                    </svg>`
                },
                {
                    id: "Handheld Shake",
                    name: "Handheld Shake",
                    category: "dynamic",
                    badge: "ORGANIC DOCUMENTARY",
                    desc: "Camera a mano con micro-vibrazioni organiche e tremolio realistico per un look documentaristico o thriller.",
                    svg: `<svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="320" height="160" fill="#140d08"/>
                        <path d="M40 85 L70 70 L95 95 L130 65 L165 90 L195 72 L230 92 L260 75 L285 85" stroke="#f59e0b" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                        <circle cx="165" cy="90" r="10" fill="#d4ff32"/>
                        <rect x="50" y="35" width="220" height="90" rx="8" stroke="rgba(245,158,11,0.3)" stroke-width="1.5" stroke-dasharray="4 4"/>
                        <text x="24" y="32" font-family="sans-serif" font-weight="900" font-size="13" fill="#ffffff" letter-spacing="2">HANDHELD SHAKE</text>
                        <text x="24" y="44" font-family="sans-serif" font-size="8" fill="#f59e0b">ORGANIC DOCUMENTARY VIBES</text>
                    </svg>`
                }
            ];

            const getCameraThumbSvg = (camId) => {
                const found = cameraStylesData.find(s => s.id.toLowerCase() === (camId || "").toLowerCase());
                if (found && found.svg) {
                    return `<div class="wox-pill-thumb">${found.svg}</div>`;
                }
                return svgIcons.camera;
            };

            const openCameraModal = () => {
                const backdrop = getModalBackdrop();
                let activeCategory = "all";
                let searchQuery = "";

                const renderCameraGrid = () => {
                    const grid = backdrop.querySelector("#wox-cam-grid-container");
                    if (!grid) return;
                    grid.innerHTML = "";

                    const filtered = cameraStylesData.filter(style => {
                        const matchesCat = activeCategory === "all" || style.category === activeCategory;
                        const query = searchQuery.trim().toLowerCase();
                        const matchesQuery = !query || 
                            style.name.toLowerCase().includes(query) ||
                            style.id.toLowerCase().includes(query) ||
                            style.badge.toLowerCase().includes(query) ||
                            style.desc.toLowerCase().includes(query);
                        return matchesCat && matchesQuery;
                    });

                    if (filtered.length === 0) {
                        grid.innerHTML = `
                            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #64748b;">
                                <div style="font-size: 28px; margin-bottom: 8px;">🎥</div>
                                <div style="font-size: 14px; font-weight: 700; color: #94a3b8;">Nessun movimento trovato</div>
                            </div>
                        `;
                        return;
                    }

                    filtered.forEach(style => {
                        const isSelected = (camera === style.id);
                        const card = document.createElement("div");
                        card.className = `wox-film-card ${isSelected ? "selected" : ""}`;
                        card.dataset.styleId = style.id;

                        card.innerHTML = `
                            <div class="wox-film-thumb">
                                ${style.svg}
                                <span class="wox-film-tag-badge">${style.badge}</span>
                                <span class="wox-film-check-badge">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    ATTIVO
                                </span>
                            </div>
                            <div class="wox-film-card-info">
                                <div class="wox-film-card-title">
                                    <span>${style.name}</span>
                                </div>
                                <div class="wox-film-card-desc">${style.desc}</div>
                            </div>
                        `;

                        card.addEventListener("click", () => {
                            camera = style.id;
                            pillCamera.updateVal(style.id);
                            if (pillCamera.updateIcon) {
                                pillCamera.updateIcon(getCameraThumbSvg(style.id));
                            }
                            setWidgetValue("camera", style.id);
                            if (app.graph && app.graph.setDirtyCanvas) {
                                app.graph.setDirtyCanvas(true, true);
                            }
                            
                            backdrop.querySelectorAll(".wox-film-card").forEach(c => c.classList.remove("selected"));
                            card.classList.add("selected");
                            
                            const currBadge = backdrop.querySelector("#wox-curr-cam-name");
                            if (currBadge) currBadge.innerText = style.id;

                            setTimeout(() => {
                                backdrop.classList.remove("open");
                            }, 140);
                        });

                        grid.appendChild(card);
                    });
                };

                backdrop.innerHTML = `
                    <div class="wox-film-modal">
                        <div class="wox-film-header">
                            <div class="wox-film-header-left">
                                <div class="wox-film-header-icon">
                                    ${svgIcons.camera}
                                </div>
                                <div>
                                    <div class="wox-film-header-title">CAMERA - MOVIMENTI & ANGOLAZIONI DI RIPRESA</div>
                                    <div class="wox-film-header-subtitle">Configura la traiettoria, il dinamismo e il punto di vista della videocamera</div>
                                </div>
                            </div>
                            <div class="wox-film-header-right">
                                <div class="wox-film-current-badge">
                                    <span>Movimento attivo:</span>
                                    <strong id="wox-curr-cam-name">${camera || "Auto"}</strong>
                                </div>
                                <button class="wox-modal-close" title="Chiudi (Esc)">✕</button>
                            </div>
                        </div>

                        <div class="wox-film-subbar">
                            <div class="wox-film-tabs">
                                <button class="wox-film-tab active" data-cat="all">Tutti (${cameraStylesData.length})</button>
                                <button class="wox-film-tab" data-cat="standard">Inquadrature Standard</button>
                                <button class="wox-film-tab" data-cat="dynamic">Dinamici & Aerei</button>
                                <button class="wox-film-tab" data-cat="auto">Intelligente</button>
                            </div>
                            <div class="wox-film-search-wrap">
                                <span class="wox-film-search-icon">🔍</span>
                                <input type="text" class="wox-film-search-input" id="wox-cam-search" placeholder="Cerca movimento (es. zoom, pan, fpv)..." />
                            </div>
                        </div>

                        <div class="wox-film-body">
                            <div class="wox-film-grid" id="wox-cam-grid-container"></div>
                        </div>
                    </div>
                `;

                const closeBtn = backdrop.querySelector(".wox-modal-close");
                if (closeBtn) {
                    closeBtn.addEventListener("click", () => backdrop.classList.remove("open"));
                }
                backdrop.onclick = (e) => {
                    if (e.target === backdrop) backdrop.classList.remove("open");
                };

                const tabs = backdrop.querySelectorAll(".wox-film-tab");
                tabs.forEach(tab => {
                    tab.addEventListener("click", () => {
                        tabs.forEach(t => t.classList.remove("active"));
                        tab.classList.add("active");
                        activeCategory = tab.dataset.cat;
                        renderCameraGrid();
                    });
                });

                const searchInput = backdrop.querySelector("#wox-cam-search");
                if (searchInput) {
                    searchInput.addEventListener("input", (e) => {
                        searchQuery = e.target.value;
                        renderCameraGrid();
                    });
                    setTimeout(() => searchInput.focus(), 100);
                }

                renderCameraGrid();
                backdrop.classList.add("open");
            };

            // Lighting Setup & Graphic Thumbnails
            const lightingStylesData = [
                {
                    id: "Auto",
                    name: "Auto (Intelligent)",
                    category: "auto",
                    badge: "AI LIGHTING",
                    desc: "Calcolo automatico dell'illuminazione e dell'atmosfera fotometrica ottimale in base al testo.",
                    svg: `<svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <radialGradient id="g-light-auto" cx="50%" cy="50%" r="50%">
                                <stop offset="0%" stop-color="#fef08a" stop-opacity="0.8"/>
                                <stop offset="50%" stop-color="#f59e0b" stop-opacity="0.3"/>
                                <stop offset="100%" stop-color="#050811" stop-opacity="0"/>
                            </radialGradient>
                        </defs>
                        <rect width="320" height="160" fill="#070a12"/>
                        <circle cx="160" cy="80" r="70" fill="url(#g-light-auto)"/>
                        <circle cx="160" cy="80" r="14" fill="#ffffff" stroke="#fef08a" stroke-width="3"/>
                        <g stroke="#fde047" stroke-width="2" stroke-linecap="round">
                            <line x1="160" y1="48" x2="160" y2="36"/><line x1="160" y1="112" x2="160" y2="124"/>
                            <line x1="128" y1="80" x2="116" y2="80"/><line x1="192" y1="80" x2="204" y2="80"/>
                            <line x1="138" y1="58" x2="128" y2="48"/><line x1="182" y1="102" x2="192" y2="112"/>
                            <line x1="138" y1="102" x2="128" y2="112"/><line x1="182" y1="58" x2="192" y2="48"/>
                        </g>
                        <text x="24" y="32" font-family="sans-serif" font-weight="900" font-size="13" fill="#ffffff" letter-spacing="2">AUTO LIGHTING</text>
                        <text x="24" y="44" font-family="sans-serif" font-size="8" fill="#fde047">NATURAL PHOTOMETRIC BALANCE</text>
                    </svg>`
                },
                {
                    id: "Studio Softbox",
                    name: "Studio Softbox",
                    category: "studio",
                    badge: "SOFT DIFFUSED",
                    desc: "Diffusore professionale softbox da studio fotografico: ombre vellutate e transizioni tonali morbidissime.",
                    svg: `<svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="g-softbox" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stop-color="#ffffff" stop-opacity="0.9"/>
                                <stop offset="70%" stop-color="#94a3b8" stop-opacity="0.3"/>
                                <stop offset="100%" stop-color="#020617" stop-opacity="0"/>
                            </linearGradient>
                        </defs>
                        <rect width="320" height="160" fill="#080c14"/>
                        <polygon points="60,35 120,50 120,110 60,125" fill="#1e293b" stroke="#fff" stroke-width="2"/>
                        <line x1="90" y1="42" x2="90" y2="118" stroke="#38bdf8" stroke-width="1.5" stroke-dasharray="3 3"/>
                        <path d="M120 50 L270 20 L270 140 L120 110 Z" fill="url(#g-softbox)"/>
                        <ellipse cx="220" cy="80" rx="14" ry="30" fill="#ffffff" opacity="0.85"/>
                        <text x="24" y="32" font-family="sans-serif" font-weight="900" font-size="13" fill="#ffffff" letter-spacing="2">STUDIO SOFTBOX</text>
                        <text x="24" y="44" font-family="sans-serif" font-size="8" fill="#94a3b8">DIFFUSED BEAUTY LIGHT • SOFT SHADOWS</text>
                    </svg>`
                },
                {
                    id: "Golden Hour",
                    name: "Golden Hour",
                    category: "natural",
                    badge: "SUNSET WARMTH",
                    desc: "Sole basso radente all'ora d'oro: luce ambrata calda, riverberi poetici e lunghe ombre evocative.",
                    svg: `<svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="g-golden" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stop-color="#7c2d12"/>
                                <stop offset="45%" stop-color="#ea580c"/>
                                <stop offset="75%" stop-color="#f59e0b"/>
                                <stop offset="100%" stop-color="#fef08a"/>
                            </linearGradient>
                        </defs>
                        <rect width="320" height="160" fill="url(#g-golden)"/>
                        <circle cx="240" cy="115" r="45" fill="#fef08a" opacity="0.95"/>
                        <path d="M0 120 Q80 110 160 125 T320 115 L320 160 L0 160 Z" fill="#1c0702"/>
                        <line x1="240" y1="115" x2="30" y2="155" stroke="#fef08a" stroke-width="2.5" opacity="0.4"/>
                        <line x1="240" y1="115" x2="100" y2="155" stroke="#fef08a" stroke-width="2" opacity="0.4"/>
                        <text x="24" y="32" font-family="serif" font-weight="900" font-size="14" fill="#ffffff" letter-spacing="3">GOLDEN HOUR</text>
                        <text x="24" y="45" font-family="sans-serif" font-size="8" fill="#fef08a">WARM SUNSET GLOW • CINEMATIC FLARE</text>
                    </svg>`
                },
                {
                    id: "Dramatic Rim Light",
                    name: "Dramatic Rim Light",
                    category: "dramatic",
                    badge: "EDGE ACCENT",
                    desc: "Luce di contorno netta e tagliente da dietro il soggetto, separandolo dallo sfondo con contorni scolpiti.",
                    svg: `<svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="320" height="160" fill="#030407"/>
                        <ellipse cx="160" cy="80" rx="42" ry="58" fill="#0a0e17"/>
                        <path d="M160 22 C185 22 202 48 202 80 C202 112 185 138 160 138" stroke="#38bdf8" stroke-width="4.5" fill="none" stroke-linecap="round"/>
                        <path d="M160 22 C135 22 118 48 118 80 C118 112 135 138 160 138" stroke="#d4ff32" stroke-width="3" fill="none" stroke-linecap="round"/>
                        <ellipse cx="215" cy="80" rx="8" ry="40" fill="#38bdf8" opacity="0.25"/>
                        <text x="24" y="32" font-family="sans-serif" font-weight="900" font-size="13" fill="#ffffff" letter-spacing="2">DRAMATIC RIM LIGHT</text>
                        <text x="24" y="44" font-family="sans-serif" font-size="8" fill="#38bdf8">HIGH-CONTRAST SILHOUETTE EDGE</text>
                    </svg>`
                },
                {
                    id: "Volumetric Fog Light",
                    name: "Volumetric Fog",
                    category: "dramatic",
                    badge: "GOD RAYS / FOG",
                    desc: "Fasci di luce tridimensionali visibili che attraversano nebbia, fumo atmosferico e particelle d'aria.",
                    svg: `<svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="g-ray-1" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stop-color="#38bdf8" stop-opacity="0.8"/>
                                <stop offset="100%" stop-color="#020617" stop-opacity="0"/>
                            </linearGradient>
                            <linearGradient id="g-ray-2" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stop-color="#d4ff32" stop-opacity="0.7"/>
                                <stop offset="100%" stop-color="#020617" stop-opacity="0"/>
                            </linearGradient>
                        </defs>
                        <rect width="320" height="160" fill="#040914"/>
                        <polygon points="40,0 70,0 260,160 170,160" fill="url(#g-ray-1)"/>
                        <polygon points="120,0 150,0 300,160 230,160" fill="url(#g-ray-2)"/>
                        <circle cx="160" cy="90" r="3" fill="#ffffff" opacity="0.6"/>
                        <circle cx="210" cy="110" r="2" fill="#38bdf8" opacity="0.7"/>
                        <circle cx="120" cy="60" r="2.5" fill="#d4ff32" opacity="0.7"/>
                        <circle cx="180" cy="50" r="1.5" fill="#ffffff" opacity="0.5"/>
                        <text x="24" y="32" font-family="sans-serif" font-weight="900" font-size="13" fill="#ffffff" letter-spacing="2">VOLUMETRIC FOG</text>
                        <text x="24" y="44" font-family="sans-serif" font-size="8" fill="#67e8f9">ATMOSPHERIC GOD RAYS • HAZE DENSITY</text>
                    </svg>`
                },
                {
                    id: "Cyber Neon Glow",
                    name: "Cyber Neon Glow",
                    category: "stylized",
                    badge: "NEON SYNTH",
                    desc: "Luci neon magenta, viola e ciano elettrico per scene cyberpunk, club notturni e ambienti futuristic-noir.",
                    svg: `<svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="320" height="160" fill="#070212"/>
                        <path d="M30 130 L110 30 L190 130" stroke="#f43f5e" stroke-width="4" stroke-linecap="round" fill="none"/>
                        <path d="M130 130 L210 30 L290 130" stroke="#06b6d4" stroke-width="4" stroke-linecap="round" fill="none"/>
                        <circle cx="110" cy="30" r="8" fill="#f43f5e" filter="drop-shadow(0 0 8px #f43f5e)"/>
                        <circle cx="210" cy="30" r="8" fill="#06b6d4" filter="drop-shadow(0 0 8px #06b6d4)"/>
                        <ellipse cx="160" cy="130" rx="100" ry="12" fill="#a855f7" opacity="0.3"/>
                        <text x="24" y="32" font-family="sans-serif" font-weight="900" font-size="13" fill="#ffffff" letter-spacing="2">CYBER NEON GLOW</text>
                        <text x="24" y="44" font-family="sans-serif" font-size="8" fill="#06b6d4">ELECTRIC VIOLET & CYAN REFLECTIONS</text>
                    </svg>`
                },
                {
                    id: "Low Key Dark",
                    name: "Low Key Dark",
                    category: "dramatic",
                    badge: "CHIAROSCURO",
                    desc: "Atmosfera chiaroscurale cupa e profonda con prevalenza di neri intensi e spot di luce selettivi.",
                    svg: `<svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <radialGradient id="g-lowkey" cx="70%" cy="35%" r="40%">
                                <stop offset="0%" stop-color="#ffffff" stop-opacity="0.85"/>
                                <stop offset="40%" stop-color="#64748b" stop-opacity="0.4"/>
                                <stop offset="100%" stop-color="#020408" stop-opacity="0"/>
                            </radialGradient>
                        </defs>
                        <rect width="320" height="160" fill="#020408"/>
                        <circle cx="220" cy="60" r="80" fill="url(#g-lowkey)"/>
                        <ellipse cx="130" cy="85" rx="30" ry="45" fill="#050811" stroke="#334155" stroke-width="1.5"/>
                        <line x1="220" y1="60" x2="155" y2="75" stroke="#ffffff" stroke-width="1.5" stroke-dasharray="4 2" opacity="0.5"/>
                        <text x="24" y="32" font-family="serif" font-weight="900" font-size="13" fill="#ffffff" letter-spacing="3">LOW KEY DARK</text>
                        <text x="24" y="44" font-family="sans-serif" font-size="8" fill="#94a3b8">DEEP SHADOWS • CHIAROSCURO</text>
                    </svg>`
                }
            ];

            const getLightingThumbSvg = (lightId) => {
                const found = lightingStylesData.find(s => s.id.toLowerCase() === (lightId || "").toLowerCase());
                if (found && found.svg) {
                    return `<div class="wox-pill-thumb">${found.svg}</div>`;
                }
                return svgIcons.light;
            };

            const openLightingModal = () => {
                const backdrop = getModalBackdrop();
                let activeCategory = "all";
                let searchQuery = "";

                const renderLightingGrid = () => {
                    const grid = backdrop.querySelector("#wox-light-grid-container");
                    if (!grid) return;
                    grid.innerHTML = "";

                    const filtered = lightingStylesData.filter(style => {
                        const matchesCat = activeCategory === "all" || style.category === activeCategory;
                        const query = searchQuery.trim().toLowerCase();
                        const matchesQuery = !query || 
                            style.name.toLowerCase().includes(query) ||
                            style.id.toLowerCase().includes(query) ||
                            style.badge.toLowerCase().includes(query) ||
                            style.desc.toLowerCase().includes(query);
                        return matchesCat && matchesQuery;
                    });

                    if (filtered.length === 0) {
                        grid.innerHTML = `
                            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #64748b;">
                                <div style="font-size: 28px; margin-bottom: 8px;">💡</div>
                                <div style="font-size: 14px; font-weight: 700; color: #94a3b8;">Nessun schema luce trovato</div>
                            </div>
                        `;
                        return;
                    }

                    filtered.forEach(style => {
                        const isSelected = (lighting === style.id);
                        const card = document.createElement("div");
                        card.className = `wox-film-card ${isSelected ? "selected" : ""}`;
                        card.dataset.styleId = style.id;

                        card.innerHTML = `
                            <div class="wox-film-thumb">
                                ${style.svg}
                                <span class="wox-film-tag-badge">${style.badge}</span>
                                <span class="wox-film-check-badge">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    ATTIVO
                                </span>
                            </div>
                            <div class="wox-film-card-info">
                                <div class="wox-film-card-title">
                                    <span>${style.name}</span>
                                </div>
                                <div class="wox-film-card-desc">${style.desc}</div>
                            </div>
                        `;

                        card.addEventListener("click", () => {
                            lighting = style.id;
                            pillLight.updateVal(style.id);
                            if (pillLight.updateIcon) {
                                pillLight.updateIcon(getLightingThumbSvg(style.id));
                            }
                            setWidgetValue("lighting", style.id);
                            if (app.graph && app.graph.setDirtyCanvas) {
                                app.graph.setDirtyCanvas(true, true);
                            }
                            
                            backdrop.querySelectorAll(".wox-film-card").forEach(c => c.classList.remove("selected"));
                            card.classList.add("selected");
                            
                            const currBadge = backdrop.querySelector("#wox-curr-light-name");
                            if (currBadge) currBadge.innerText = style.id;

                            setTimeout(() => {
                                backdrop.classList.remove("open");
                            }, 140);
                        });

                        grid.appendChild(card);
                    });
                };

                backdrop.innerHTML = `
                    <div class="wox-film-modal">
                        <div class="wox-film-header">
                            <div class="wox-film-header-left">
                                <div class="wox-film-header-icon">
                                    ${svgIcons.light}
                                </div>
                                <div>
                                    <div class="wox-film-header-title">LIGHTING - ILLUMINAZIONE & ATMOSFERA CINEMATOGRAFICA</div>
                                    <div class="wox-film-header-subtitle">Seleziona lo schema di luce da studio, fotometria naturale o accenti volumetrici</div>
                                </div>
                            </div>
                            <div class="wox-film-header-right">
                                <div class="wox-film-current-badge">
                                    <span>Luce attiva:</span>
                                    <strong id="wox-curr-light-name">${lighting || "Auto"}</strong>
                                </div>
                                <button class="wox-modal-close" title="Chiudi (Esc)">✕</button>
                            </div>
                        </div>

                        <div class="wox-film-subbar">
                            <div class="wox-film-tabs">
                                <button class="wox-film-tab active" data-cat="all">Tutti (${lightingStylesData.length})</button>
                                <button class="wox-film-tab" data-cat="studio">Studio & Diffusione</button>
                                <button class="wox-film-tab" data-cat="natural">Luce Naturale</button>
                                <button class="wox-film-tab" data-cat="dramatic">Drammatici & Contrasto</button>
                                <button class="wox-film-tab" data-cat="stylized">Stilizzati & Neon</button>
                            </div>
                            <div class="wox-film-search-wrap">
                                <span class="wox-film-search-icon">🔍</span>
                                <input type="text" class="wox-film-search-input" id="wox-light-search" placeholder="Cerca luce (es. softbox, golden, neon)..." />
                            </div>
                        </div>

                        <div class="wox-film-body">
                            <div class="wox-film-grid" id="wox-light-grid-container"></div>
                        </div>
                    </div>
                `;

                const closeBtn = backdrop.querySelector(".wox-modal-close");
                if (closeBtn) {
                    closeBtn.addEventListener("click", () => backdrop.classList.remove("open"));
                }
                backdrop.onclick = (e) => {
                    if (e.target === backdrop) backdrop.classList.remove("open");
                };

                const tabs = backdrop.querySelectorAll(".wox-film-tab");
                tabs.forEach(tab => {
                    tab.addEventListener("click", () => {
                        tabs.forEach(t => t.classList.remove("active"));
                        tab.classList.add("active");
                        activeCategory = tab.dataset.cat;
                        renderLightingGrid();
                    });
                });

                const searchInput = backdrop.querySelector("#wox-light-search");
                if (searchInput) {
                    searchInput.addEventListener("input", (e) => {
                        searchQuery = e.target.value;
                        renderLightingGrid();
                    });
                    setTimeout(() => searchInput.focus(), 100);
                }

                renderLightingGrid();
                backdrop.classList.add("open");
            };

            // Color Palettes & Graphic Thumbnails (Inspired by Film Moodboards)
            const colorPaletteStylesData = [
                {
                    id: "Auto",
                    name: "Auto (Intelligent)",
                    category: "auto",
                    badge: "SMART HARMONY",
                    refFile: null,
                    refTag: null,
                    swatches: ["#38bdf8", "#818cf8", "#c084fc", "#f43f5e", "#fb923c", "#facc15", "#4ade80", "#2dd4bf", "#e2e8f0", "#1e293b"],
                    desc: "Bilanciamento cromatico intelligente dell'AI: analizza il testo per creare un'armonia tonale ad hoc.",
                    svg: `<svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="g-pal-auto" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stop-color="#38bdf8"/>
                                <stop offset="25%" stop-color="#a855f7"/>
                                <stop offset="50%" stop-color="#f43f5e"/>
                                <stop offset="75%" stop-color="#f59e0b"/>
                                <stop offset="100%" stop-color="#10b981"/>
                            </linearGradient>
                        </defs>
                        <rect width="320" height="160" fill="#080c14"/>
                        <circle cx="160" cy="80" r="52" stroke="url(#g-pal-auto)" stroke-width="8" fill="none"/>
                        <circle cx="160" cy="80" r="26" fill="#181d28" stroke="#d4ff32" stroke-width="2"/>
                        <circle cx="160" cy="80" r="8" fill="#d4ff32"/>
                        <text x="24" y="32" font-family="sans-serif" font-weight="900" font-size="13" fill="#ffffff" letter-spacing="2">AUTO COLOR PALETTE</text>
                        <text x="24" y="44" font-family="sans-serif" font-size="8" fill="#d4ff32">SMART ADAPTIVE CINEMATIC COLOR</text>
                    </svg>`
                },
                {
                    id: "Neon Rain at Midnight",
                    name: "Neon Rain at Midnight",
                    category: "film",
                    badge: "NEON MIDNIGHT",
                    refFile: "palette_neon_rain_at_midnight.png",
                    refTag: "@neon_rain",
                    swatches: ["#0c0c0e", "#334d4e", "#7b3612", "#676650", "#497197", "#708986", "#b3978e", "#95b0c2", "#f3e04e", "#446bc7"],
                    desc: "Riflessi bagnati notturni, ciano e magenta su asfalto umido, luce al neon tagliente e ombre profonde.",
                    svg: `<svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="g-neonrain-sky" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stop-color="#05050f"/>
                                <stop offset="60%" stop-color="#160824"/>
                                <stop offset="100%" stop-color="#02141c"/>
                            </linearGradient>
                        </defs>
                        <rect width="320" height="160" fill="url(#g-neonrain-sky)"/>
                        <g stroke="#06b6d4" stroke-width="1.5" opacity="0.3">
                            <line x1="40" y1="0" x2="20" y2="160"/><line x1="120" y1="0" x2="100" y2="160"/><line x1="200" y1="0" x2="180" y2="160"/><line x1="280" y1="0" x2="260" y2="160"/>
                        </g>
                        <rect x="50" y="40" width="70" height="80" rx="4" fill="#0f0728" stroke="#f43f5e" stroke-width="2"/>
                        <rect x="200" y="30" width="80" height="95" rx="4" fill="#041624" stroke="#06b6d4" stroke-width="2"/>
                        <ellipse cx="160" cy="135" rx="130" ry="16" fill="#f43f5e" opacity="0.25"/>
                        <ellipse cx="220" cy="138" rx="80" ry="10" fill="#06b6d4" opacity="0.35"/>
                        <circle cx="140" cy="50" r="18" fill="#f3e04e" filter="drop-shadow(0 0 10px #f3e04e)"/>
                        <text x="24" y="28" font-family="sans-serif" font-weight="900" font-size="13" fill="#ffffff" letter-spacing="2">NEON RAIN AT MIDNIGHT</text>
                        <text x="24" y="40" font-family="sans-serif" font-size="8" fill="#38bdf8">CYBERPUNK WET REFLECTIONS • REFERENCE INCLUDED</text>
                    </svg>`
                },
                {
                    id: "Home Is the Next Gas Station",
                    name: "Home Is the Next Gas Station",
                    category: "film",
                    badge: "COLD MELANCHOLY",
                    refFile: "palette_home_is_the_next_gas_station.png",
                    refTag: "@next_gas_station",
                    swatches: ["#0d0907", "#14182f", "#57514e", "#766360", "#596d8a", "#8c868a", "#7d92bd", "#878ba1", "#b2aeb2", "#20345c"],
                    desc: "Toni freddi desaturati, grigio-azzurro nostalgico, cielo nebbioso e solitudine poetica americana.",
                    svg: `<svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="g-gas-bg" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stop-color="#243447"/>
                                <stop offset="60%" stop-color="#475b70"/>
                                <stop offset="100%" stop-color="#141c24"/>
                            </linearGradient>
                        </defs>
                        <rect width="320" height="160" fill="url(#g-gas-bg)"/>
                        <polygon points="0,120 120,105 200,108 320,118 320,160 0,160" fill="#0f161e"/>
                        <polygon points="140,85 180,85 195,115 125,115" fill="#1e2c3a" stroke="#7d92bd" stroke-width="1.5"/>
                        <circle cx="240" cy="70" r="16" fill="#b2aeb2" opacity="0.3"/>
                        <line x1="0" y1="140" x2="320" y2="140" stroke="#7d92bd" stroke-width="1.5" stroke-dasharray="10 8" opacity="0.6"/>
                        <text x="24" y="28" font-family="sans-serif" font-weight="900" font-size="13" fill="#ffffff" letter-spacing="1.5">HOME IS NEXT GAS STATION</text>
                        <text x="24" y="40" font-family="sans-serif" font-size="8" fill="#93c5fd">COLD CINEMATIC MELANCHOLY • REFERENCE INCLUDED</text>
                    </svg>`
                },
                {
                    id: "The Crimson Ballet",
                    name: "The Crimson Ballet",
                    category: "film",
                    badge: "VIBRANT POP RED",
                    refFile: "palette_the_crimson_ballet.png",
                    refTag: "@crimson_ballet",
                    swatches: ["#0b0509", "#291c7d", "#621418", "#475be0", "#d3184e", "#807d8b", "#b59c93", "#c5bfd9", "#f2e322", "#d20c25"],
                    desc: "Rosso carminio acceso, blu cobalto teatrale, giallo primario e contrasto scenografico ad altissimo impatto.",
                    svg: `<svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="g-crim-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stop-color="#3b0714"/>
                                <stop offset="50%" stop-color="#881337"/>
                                <stop offset="100%" stop-color="#1e1b4b"/>
                            </linearGradient>
                        </defs>
                        <rect width="320" height="160" fill="url(#g-crim-bg)"/>
                        <circle cx="160" cy="75" r="48" fill="#d3184e" opacity="0.85"/>
                        <circle cx="160" cy="75" r="30" fill="#f2e322" opacity="0.9"/>
                        <polygon points="120,140 160,50 200,140" fill="#291c7d" opacity="0.8"/>
                        <text x="24" y="28" font-family="sans-serif" font-weight="900" font-size="13" fill="#ffffff" letter-spacing="2">THE CRIMSON BALLET</text>
                        <text x="24" y="40" font-family="sans-serif" font-size="8" fill="#f43f5e">VIBRANT THEATRICAL POP • REFERENCE INCLUDED</text>
                    </svg>`
                },
                {
                    id: "The Morning After Rain",
                    name: "The Morning After Rain",
                    category: "film",
                    badge: "TEAL CYAN FOREST",
                    refFile: "palette_the_morning_after_rain.png",
                    refTag: "@morning_after_rain",
                    swatches: ["#0b0b0b", "#3c3228", "#5e6459", "#3e6f81", "#7c7670", "#458f83", "#8ba1af", "#6ec9ce", "#c1d4e0", "#255e54"],
                    desc: "Verde ottanio umido, sottobosco velato, ciano glaciale post-temporale e aria limpida di prima mattina.",
                    svg: `<svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="g-rain-bg" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stop-color="#041f1c"/>
                                <stop offset="50%" stop-color="#0e3a35"/>
                                <stop offset="100%" stop-color="#164e63"/>
                            </linearGradient>
                        </defs>
                        <rect width="320" height="160" fill="url(#g-rain-bg)"/>
                        <path d="M20 130 Q100 70 180 120 T320 100 L320 160 L0 160 Z" fill="#041412"/>
                        <g stroke="#6ec9ce" stroke-width="1.5" stroke-linecap="round" opacity="0.6">
                            <line x1="80" y1="40" x2="70" y2="70"/><line x1="160" y1="30" x2="150" y2="60"/><line x1="240" y1="45" x2="230" y2="75"/>
                        </g>
                        <ellipse cx="160" cy="110" rx="90" ry="18" fill="#255e54" opacity="0.7"/>
                        <text x="24" y="28" font-family="sans-serif" font-weight="900" font-size="13" fill="#ffffff" letter-spacing="2">THE MORNING AFTER RAIN</text>
                        <text x="24" y="40" font-family="sans-serif" font-size="8" fill="#6ec9ce">ATMOSPHERIC TEAL & FOREST • REFERENCE INCLUDED</text>
                    </svg>`
                },
                {
                    id: "Turquoise Mirage",
                    name: "Turquoise Mirage",
                    category: "film",
                    badge: "TURQUOISE PASTEL",
                    refFile: "palette_turquoise_mirage.png",
                    refTag: "@turquoise_mirage",
                    swatches: ["#161614", "#054503", "#66635a", "#9a6941", "#6a8474", "#4aa290", "#9c9e72", "#59cec2", "#cad7a2", "#0d8b06"],
                    desc: "Verde turchese tenue retrò, toni sabbia pastello, simmetria in stile Wes Anderson e calore solare da hotel vintage.",
                    svg: `<svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="g-turq-bg" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stop-color="#cad7a2"/>
                                <stop offset="60%" stop-color="#59cec2"/>
                                <stop offset="100%" stop-color="#1e3a2b"/>
                            </linearGradient>
                        </defs>
                        <rect width="320" height="160" fill="url(#g-turq-bg)"/>
                        <rect x="60" y="30" width="200" height="90" fill="#fffbe8" opacity="0.8" rx="6"/>
                        <rect x="80" y="50" width="40" height="50" fill="#59cec2" rx="3"/>
                        <rect x="140" y="50" width="40" height="50" fill="#9a6941" rx="3"/>
                        <rect x="200" y="50" width="40" height="50" fill="#59cec2" rx="3"/>
                        <text x="24" y="26" font-family="sans-serif" font-weight="900" font-size="13" fill="#134e4a" letter-spacing="2">TURQUOISE MIRAGE</text>
                        <text x="24" y="38" font-family="sans-serif" font-size="8" fill="#0f766e">PASTEL RETRO SYMMETRY • REFERENCE INCLUDED</text>
                    </svg>`
                },
                {
                    id: "Yellow Room",
                    name: "Yellow Room",
                    category: "film",
                    badge: "VINTAGE OCHRE",
                    refFile: "palette_yellow_room.png",
                    refTag: "@yellow_room",
                    swatches: ["#0e0606", "#222e2a", "#513d1a", "#6a6a67", "#388516", "#a3a59c", "#67b5ae", "#d0b32b", "#e3eccb", "#ebd41a"],
                    desc: "Tungsteno claustrofobico, ocra dorato, cuoio vintage anni '70 e toni acidi per thriller psicologici e noir d'autore.",
                    svg: `<svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <radialGradient id="g-yel-core" cx="50%" cy="40%" r="60%">
                                <stop offset="0%" stop-color="#ebd41a" stop-opacity="0.9"/>
                                <stop offset="60%" stop-color="#85610b" stop-opacity="0.7"/>
                                <stop offset="100%" stop-color="#140a02"/>
                            </radialGradient>
                        </defs>
                        <rect width="320" height="160" fill="url(#g-yel-core)"/>
                        <line x1="160" y1="0" x2="160" y2="40" stroke="#0e0606" stroke-width="2"/>
                        <circle cx="160" cy="45" r="10" fill="#ebd41a" filter="drop-shadow(0 0 12px #ebd41a)"/>
                        <polygon points="160,45 60,160 260,160" fill="#ebd41a" opacity="0.2"/>
                        <rect x="90" y="115" width="140" height="35" rx="4" fill="#222e2a" stroke="#d0b32b" stroke-width="1.5"/>
                        <text x="24" y="28" font-family="serif" font-weight="900" font-size="14" fill="#ffffff" letter-spacing="3">YELLOW ROOM</text>
                        <text x="24" y="40" font-family="sans-serif" font-size="8" fill="#fde047">70s OCHRE TUNGSTEN NOIR • REFERENCE INCLUDED</text>
                    </svg>`
                },
                {
                    id: "Teal & Orange",
                    name: "Teal & Orange",
                    category: "classic",
                    badge: "BLOCKBUSTER LOOK",
                    refFile: null,
                    refTag: null,
                    swatches: ["#083344", "#0e7490", "#06b6d4", "#67e8f9", "#cbd5e1", "#fed7aa", "#fb923c", "#f97316", "#c2410c", "#7c2d12"],
                    desc: "Il look dei grandi colossal di Hollywood: contrasto complementare perfetto tra incarnati caldi e ombre turchesi.",
                    svg: `<svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="g-to-split" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stop-color="#083344"/>
                                <stop offset="50%" stop-color="#06b6d4"/>
                                <stop offset="50%" stop-color="#ea580c"/>
                                <stop offset="100%" stop-color="#7c2d12"/>
                            </linearGradient>
                        </defs>
                        <rect width="320" height="160" fill="url(#g-to-split)"/>
                        <circle cx="80" cy="80" r="32" fill="#083344" stroke="#67e8f9" stroke-width="2"/>
                        <circle cx="240" cy="80" r="32" fill="#7c2d12" stroke="#fed7aa" stroke-width="2"/>
                        <text x="24" y="32" font-family="sans-serif" font-weight="900" font-size="13" fill="#ffffff" letter-spacing="2">TEAL & ORANGE</text>
                        <text x="24" y="44" font-family="sans-serif" font-size="8" fill="#fde047">HOLLYWOOD BLOCKBUSTER CONTRAST</text>
                    </svg>`
                },
                {
                    id: "Cyberpunk Neon",
                    name: "Cyberpunk Neon",
                    category: "classic",
                    badge: "SYNTHWAVE NEON",
                    refFile: null,
                    refTag: null,
                    swatches: ["#030712", "#3b0764", "#701a75", "#c026d3", "#f43f5e", "#06b6d4", "#38bdf8", "#818cf8", "#e0e7ff", "#ffffff"],
                    desc: "Colori al neon ad alta saturazione, bagliori elettrici fucsia e ciano e riflessi sintetici da futuro distopico.",
                    svg: `<svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="320" height="160" fill="#090214"/>
                        <path d="M30 130 L110 35 L190 130" stroke="#f43f5e" stroke-width="4" stroke-linecap="round" fill="none"/>
                        <path d="M130 130 L210 35 L290 130" stroke="#06b6d4" stroke-width="4" stroke-linecap="round" fill="none"/>
                        <circle cx="110" cy="35" r="8" fill="#f43f5e"/>
                        <circle cx="210" cy="35" r="8" fill="#06b6d4"/>
                        <text x="24" y="32" font-family="sans-serif" font-weight="900" font-size="13" fill="#ffffff" letter-spacing="2">CYBERPUNK NEON</text>
                        <text x="24" y="44" font-family="sans-serif" font-size="8" fill="#06b6d4">HIGH SATURATION SYNTH VIBES</text>
                    </svg>`
                },
                {
                    id: "B&W Monochrome",
                    name: "B&W Monochrome",
                    category: "classic",
                    badge: "FINE ART NOIR",
                    refFile: null,
                    refTag: null,
                    swatches: ["#000000", "#18181b", "#27272a", "#3f3f46", "#71717a", "#a1a1aa", "#d4d4d8", "#e4e4e7", "#f4f4f5", "#ffffff"],
                    desc: "Bianco e nero d'autore, gradienti tonali ricchissimi, neri d'inchiostro profondi e bianchi puri da pellicola.",
                    svg: `<svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="g-bw-bar" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stop-color="#000000"/>
                                <stop offset="50%" stop-color="#71717a"/>
                                <stop offset="100%" stop-color="#ffffff"/>
                            </linearGradient>
                        </defs>
                        <rect width="320" height="160" fill="#09090b"/>
                        <rect x="40" y="60" width="240" height="40" rx="6" fill="url(#g-bw-bar)" stroke="#52525b" stroke-width="1.5"/>
                        <text x="24" y="32" font-family="serif" font-weight="900" font-size="14" fill="#ffffff" letter-spacing="3">B&W MONOCHROME</text>
                        <text x="24" y="44" font-family="sans-serif" font-size="8" fill="#d4d4d8">TIMELESS CONTRAST & FINE GRAIN</text>
                    </svg>`
                },
                {
                    id: "Warm Sunset",
                    name: "Warm Sunset",
                    category: "classic",
                    badge: "AMBER DUSK",
                    refFile: null,
                    refTag: null,
                    swatches: ["#451a03", "#78350f", "#b45309", "#d97706", "#f59e0b", "#fbbf24", "#fef08a", "#ea580c", "#dc2626", "#7f1d1d"],
                    desc: "Colori crepuscolari caldi, sfumature arancio miele, ocra infuocato e ombre lunghe da fine giornata.",
                    svg: `<svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <defs>
                            <linearGradient id="g-sunset-bar" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stop-color="#78350f"/>
                                <stop offset="50%" stop-color="#f59e0b"/>
                                <stop offset="100%" stop-color="#451a03"/>
                            </linearGradient>
                        </defs>
                        <rect width="320" height="160" fill="url(#g-sunset-bar)"/>
                        <circle cx="160" cy="110" r="40" fill="#fef08a" opacity="0.9"/>
                        <text x="24" y="32" font-family="sans-serif" font-weight="900" font-size="13" fill="#ffffff" letter-spacing="2">WARM SUNSET</text>
                        <text x="24" y="44" font-family="sans-serif" font-size="8" fill="#fef08a">GOLDEN CREPUSCULAR WARMTH</text>
                    </svg>`
                },
                {
                    id: "Cool Moonlight",
                    name: "Cool Moonlight",
                    category: "classic",
                    badge: "NOCTURNE BLUE",
                    refFile: null,
                    refTag: null,
                    swatches: ["#020617", "#0f172a", "#1e293b", "#334155", "#475569", "#64748b", "#94a3b8", "#38bdf8", "#bae6fd", "#f0f9ff"],
                    desc: "Notturno argenteo, luce lunare blu cobalto e indaco freddo con riflessi color ghiaccio e acciaio.",
                    svg: `<svg viewBox="0 0 320 160" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="320" height="160" fill="#020617"/>
                        <circle cx="230" cy="65" r="30" fill="#bae6fd" opacity="0.85"/>
                        <circle cx="220" cy="65" r="28" fill="#020617"/>
                        <polygon points="0,130 100,105 200,120 320,95 320,160 0,160" fill="#0f172a"/>
                        <text x="24" y="32" font-family="sans-serif" font-weight="900" font-size="13" fill="#ffffff" letter-spacing="2">COOL MOONLIGHT</text>
                        <text x="24" y="44" font-family="sans-serif" font-size="8" fill="#38bdf8">SILVER NOCTURNE • DEEP INDIGO</text>
                    </svg>`
                }
            ];

            const getColorThumbSvg = (palId) => {
                const found = colorPaletteStylesData.find(s => s.id.toLowerCase() === (palId || "").toLowerCase());
                if (found && found.svg) {
                    return `<div class="wox-pill-thumb">${found.svg}</div>`;
                }
                return svgIcons.color;
            };

            const openColorModal = () => {
                const backdrop = getModalBackdrop();
                let activeCategory = "all";
                let searchQuery = "";

                const renderColorGrid = () => {
                    const grid = backdrop.querySelector("#wox-color-grid-container");
                    if (!grid) return;
                    grid.innerHTML = "";

                    const filtered = colorPaletteStylesData.filter(style => {
                        const matchesCat = activeCategory === "all" || style.category === activeCategory;
                        const query = searchQuery.trim().toLowerCase();
                        const matchesQuery = !query || 
                            style.name.toLowerCase().includes(query) ||
                            style.id.toLowerCase().includes(query) ||
                            style.badge.toLowerCase().includes(query) ||
                            style.desc.toLowerCase().includes(query);
                        return matchesCat && matchesQuery;
                    });

                    if (filtered.length === 0) {
                        grid.innerHTML = `
                            <div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #64748b;">
                                <div style="font-size: 28px; margin-bottom: 8px;">🎨</div>
                                <div style="font-size: 14px; font-weight: 700; color: #94a3b8;">Nessuna palette trovata</div>
                            </div>
                        `;
                        return;
                    }

                    filtered.forEach(style => {
                        const isSelected = (colorPalette === style.id);
                        const card = document.createElement("div");
                        card.className = `wox-film-card ${isSelected ? "selected" : ""}`;
                        card.dataset.styleId = style.id;

                        // Swatches HTML
                        const swatchesHtml = style.swatches.map(c => 
                            `<span class="wox-palette-swatch-item" style="background-color: ${c};" title="${c}"></span>`
                        ).join("");

                        const refTagNotice = style.refTag ? 
                            `<span style="display: inline-flex; align-items: center; gap: 4px; font-size: 9px; font-weight: 800; color: #d4ff32; background: rgba(212,255,50,0.12); padding: 2px 6px; border-radius: 4px; margin-top: 4px;">📸 REFERENCE AUTO: ${style.refTag}</span>` : "";

                        card.innerHTML = `
                            <div class="wox-film-thumb">
                                ${style.svg}
                                <span class="wox-film-tag-badge">${style.badge}</span>
                                <span class="wox-film-check-badge">
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                    ATTIVO
                                </span>
                            </div>
                            <div class="wox-film-card-info">
                                <div class="wox-film-card-title">
                                    <span>${style.name}</span>
                                </div>
                                <div class="wox-palette-swatches">
                                    ${swatchesHtml}
                                </div>
                                <div class="wox-film-card-desc">${style.desc}</div>
                                ${refTagNotice}
                            </div>
                        `;

                        card.addEventListener("click", () => {
                            colorPalette = style.id;
                            pillColor.updateVal(style.id);
                            if (pillColor.updateIcon) {
                                pillColor.updateIcon(getColorThumbSvg(style.id));
                            }
                            setWidgetValue("color_palette", style.id);

                            // AUTO-INSERT REFERENCE IMAGE IF PALETTE HAS ONE
                            if (style.refTag) {
                                let curText = promptInput.value || "";
                                // Check if any other palette tag is present and replace or prepend
                                const allPaletteTags = colorPaletteStylesData.map(s => s.refTag).filter(Boolean);
                                allPaletteTags.forEach(t => {
                                    if (t !== style.refTag) {
                                        curText = curText.split(t).join("").replace(/\\s+/g, " ").trim();
                                    }
                                });
                                if (!curText.includes(style.refTag)) {
                                    curText = `${style.refTag} ${curText}`.trim();
                                }
                                promptInput.value = curText;
                                setWidgetValue("prompt", curText);
                                updateActiveRefsUI();
                                syncPromptToActiveNodes(curText);
                            }

                            if (app.graph && app.graph.setDirtyCanvas) {
                                app.graph.setDirtyCanvas(true, true);
                            }
                            
                            backdrop.querySelectorAll(".wox-film-card").forEach(c => c.classList.remove("selected"));
                            card.classList.add("selected");
                            
                            const currBadge = backdrop.querySelector("#wox-curr-color-name");
                            if (currBadge) currBadge.innerText = style.id;

                            setTimeout(() => {
                                backdrop.classList.remove("open");
                            }, 140);
                        });

                        grid.appendChild(card);
                    });
                };

                backdrop.innerHTML = `
                    <div class="wox-film-modal">
                        <div class="wox-film-header">
                            <div class="wox-film-header-left">
                                <div class="wox-film-header-icon">
                                    ${svgIcons.color}
                                </div>
                                <div>
                                    <div class="wox-film-header-title">COLOR PALETTE - MOODBOARD CROMATICO CINEMATOGRAFICO</div>
                                    <div class="wox-film-header-subtitle">Seleziona una palette cinematografica: applica automaticamente lo swatch e la reference image collegata</div>
                                </div>
                            </div>
                            <div class="wox-film-header-right">
                                <div class="wox-film-current-badge">
                                    <span>Palette attiva:</span>
                                    <strong id="wox-curr-color-name">${colorPalette || "Auto"}</strong>
                                </div>
                                <button class="wox-modal-close" title="Chiudi (Esc)">✕</button>
                            </div>
                        </div>

                        <div class="wox-film-subbar">
                            <div class="wox-film-tabs">
                                <button class="wox-film-tab active" data-cat="all">Tutti (${colorPaletteStylesData.length})</button>
                                <button class="wox-film-tab" data-cat="film">🎬 Moodboard Film (6 Reference)</button>
                                <button class="wox-film-tab" data-cat="classic">Classici da Studio</button>
                                <button class="wox-film-tab" data-cat="auto">Intelligente</button>
                            </div>
                            <div class="wox-film-search-wrap">
                                <span class="wox-film-search-icon">🔍</span>
                                <input type="text" class="wox-film-search-input" id="wox-color-search" placeholder="Cerca palette (es. neon rain, gas station, crimson)..." />
                            </div>
                        </div>

                        <div class="wox-film-body">
                            <div class="wox-film-grid" id="wox-color-grid-container"></div>
                        </div>
                    </div>
                `;

                const closeBtn = backdrop.querySelector(".wox-modal-close");
                if (closeBtn) {
                    closeBtn.addEventListener("click", () => backdrop.classList.remove("open"));
                }
                backdrop.onclick = (e) => {
                    if (e.target === backdrop) backdrop.classList.remove("open");
                };

                const tabs = backdrop.querySelectorAll(".wox-film-tab");
                tabs.forEach(tab => {
                    tab.addEventListener("click", () => {
                        tabs.forEach(t => t.classList.remove("active"));
                        tab.classList.add("active");
                        activeCategory = tab.dataset.cat;
                        renderColorGrid();
                    });
                });

                const searchInput = backdrop.querySelector("#wox-color-search");
                if (searchInput) {
                    searchInput.addEventListener("input", (e) => {
                        searchQuery = e.target.value;
                        renderColorGrid();
                    });
                    setTimeout(() => searchInput.focus(), 100);
                }

                renderColorGrid();
                backdrop.classList.add("open");
            };

            // State variables for References & Autocomplete
            let references = [];
            let activeRefCategory = "All";
            let activeRefFilter = "Recent";

            const fetchReferences = async () => {
                try {
                    let res = null;
                    const cacheBust = `/wox_cinema/references?_t=${Date.now()}`;
                    try {
                        res = await fetch(cacheBust, { cache: "no-store" });
                    } catch (e) {
                        res = await api.fetchApi(cacheBust);
                    }
                    if (res && res.ok) {
                        const data = await res.json();
                        if (data.references) {
                            const deletedSet = getDeletedRefs();
                            references = data.references.filter(r => {
                                const fn = (r.filename || "").toLowerCase();
                                const raw = (r.raw_filename || "").toLowerCase();
                                const id = (r.id || "").toLowerCase();
                                const base = fn.replace("woxcinema/", "");
                                return !deletedSet.has(fn) && !deletedSet.has(raw) && !deletedSet.has(id) && !deletedSet.has(base);
                            });
                            pillRefs.updateVal(`${references.length}/50`);
                            renderRefModalGrid();
                            updateActiveRefsUI();
                        }
                    }
                } catch (e) {
                    console.log("WOX Cinema: fetch references error", e);
                }
            };

            const pillRefs = createPill(svgIcons.refs, "References", "0/50", ["0/50"], () => {
                openRefModal();
            });
            
            const filmOptions = [
                "General", "Cinematic 35mm", "IMAX 70mm", "NOIR", "Noir Classic",
                "Action", "Horror", "Comedy", "Epic", "Drama",
                "Vintage Super 8", "Anime Style", "Hyperrealistic 8k", "Auto"
            ];
            const pillFilm = createPill(getFilmThumbSvg(filmSetup || "General"), "Film setup", filmSetup || "General", filmOptions, (v) => {
                filmSetup = v;
                if (pillFilm.updateIcon) {
                    pillFilm.updateIcon(getFilmThumbSvg(v));
                }
                setWidgetValue("film_setup", v);
            }, () => {
                openFilmModal();
            });

            const cameraOptions = ["Auto", "Static Tripod", "Pan Left to Right", "Tilt Up", "Slow Zoom In", "Drone FPV", "360 Orbit", "Handheld Shake"];
            const pillCamera = createPill(getCameraThumbSvg(camera || "Auto"), "Camera", camera || "Auto", cameraOptions, (v) => {
                camera = v;
                if (pillCamera.updateIcon) {
                    pillCamera.updateIcon(getCameraThumbSvg(v));
                }
                setWidgetValue("camera", v);
            }, () => {
                openCameraModal();
            });

            const colorOptions = [
                "Auto",
                "Neon Rain at Midnight",
                "Home Is the Next Gas Station",
                "The Crimson Ballet",
                "The Morning After Rain",
                "Turquoise Mirage",
                "Yellow Room",
                "Teal & Orange",
                "Cyberpunk Neon",
                "B&W Monochrome",
                "Warm Sunset",
                "Cool Moonlight"
            ];
            const pillColor = createPill(getColorThumbSvg(colorPalette || "Auto"), "Color palette", colorPalette || "Auto", colorOptions, (v) => {
                colorPalette = v;
                if (pillColor.updateIcon) {
                    pillColor.updateIcon(getColorThumbSvg(v));
                }
                setWidgetValue("color_palette", v);

                // Check if this palette has an associated reference tag
                const found = colorPaletteStylesData.find(s => s.id.toLowerCase() === v.toLowerCase());
                if (found && found.refTag) {
                    let curText = promptInput.value || "";
                    const allPaletteTags = colorPaletteStylesData.map(s => s.refTag).filter(Boolean);
                    allPaletteTags.forEach(t => {
                        if (t !== found.refTag) {
                            curText = curText.split(t).join("").replace(/\s+/g, " ").trim();
                        }
                    });
                    if (!curText.includes(found.refTag)) {
                        curText = `${found.refTag} ${curText}`.trim();
                    }
                    promptInput.value = curText;
                    setWidgetValue("prompt", curText);
                    updateActiveRefsUI();
                    syncPromptToActiveNodes(curText);
                }
            }, () => {
                openColorModal();
            });

            const lightOptions = ["Auto", "Studio Softbox", "Golden Hour", "Dramatic Rim Light", "Volumetric Fog Light", "Cyber Neon Glow", "Low Key Dark"];
            const pillLight = createPill(getLightingThumbSvg(lighting || "Auto"), "Lighting", lighting || "Auto", lightOptions, (v) => {
                lighting = v;
                if (pillLight.updateIcon) {
                    pillLight.updateIcon(getLightingThumbSvg(v));
                }
                setWidgetValue("lighting", v);
            }, () => {
                openLightingModal();
            });

            pillsBar.appendChild(pillRefs.pill);
            pillsBar.appendChild(pillFilm.pill);
            pillsBar.appendChild(pillCamera.pill);
            pillsBar.appendChild(pillColor.pill);
            pillsBar.appendChild(pillLight.pill);

            // 4. BOTTOM PROMPT & ACTION SECTION
            const promptSection = document.createElement("div");
            promptSection.className = "wox-prompt-section";

            // Left Mode Toggle (Image vs Video)
            const modeToggle = document.createElement("div");
            modeToggle.className = "wox-mode-toggle";

            const btnImg = document.createElement("button");
            btnImg.className = "wox-mode-btn";
            btnImg.innerHTML = `<span>${svgIcons.image}</span><span>Image</span>`;

            const btnVid = document.createElement("button");
            btnVid.className = "wox-mode-btn active";
            btnVid.innerHTML = `<span>${svgIcons.video}</span><span>Video</span>`;

            const updateModeUI = (mode) => {
                currentMode = mode;
                setWidgetValue("mode", mode);
                if (typeof updateChipsVisibilityForMode === "function") {
                    updateChipsVisibilityForMode();
                }
                if (mode.includes("Image")) {
                    btnImg.classList.add("active");
                    btnVid.classList.remove("active");
                    chipModel.innerText = "⚡ Z-Image Turbo >";
                    syncOrBuildZImageTurboPipeline();
                    fetchRecentImages();
                    renderGallery();
                } else {
                    btnVid.classList.add("active");
                    btnImg.classList.remove("active");
                    chipModel.innerText = "⚡ Minimax H3 >";
                    syncOrBuildMiniMaxH3Pipeline();
                    syncPromptToActiveNodes(promptInput.value);
                    fetchRecentVideos();
                    renderGallery();
                }
            };

            btnImg.addEventListener("click", () => updateModeUI("Image (Z-Image Turbo)"));
            btnVid.addEventListener("click", () => updateModeUI("Video (Minimax H3)"));

            modeToggle.appendChild(btnImg);
            modeToggle.appendChild(btnVid);

            // Right Main Input Box
            const mainBox = document.createElement("div");
            mainBox.className = "wox-main-box";
            mainBox.style.position = "relative";

            // Textarea
            const promptInput = document.createElement("textarea");
            promptInput.className = "wox-textarea";
            promptInput.placeholder = "Describe your scene - use @ to add characters & locations";

            const syncPromptToActiveNodes = (rawText) => {
                const text = rawText !== undefined ? rawText : (promptInput.value || "");
                let usedRefs = references.filter(r => r.tag && text.includes(r.tag));
                let refPrompt = text;
                usedRefs.forEach((ref, rIdx) => {
                    const picTag = `<Picture ${rIdx + 1}>`;
                    refPrompt = refPrompt.split(ref.tag).join(picTag);
                });

                if (app && app.graph && app.graph._nodes) {
                    app.graph._nodes.forEach(n => {
                        if (!n || !n.widgets) return;
                        if (n.type === "MiniMaxH3ReferenceToVideo" || n.title === "MiniMax H3 Reference to Video") {
                            const pw = n.widgets.find(w => w.name === "prompt") || n.widgets[0];
                            if (pw) {
                                pw.value = refPrompt;
                                if (pw.callback) pw.callback(refPrompt);
                            }
                        } else if (n.type === "MiniMaxH3ImageToVideo" || n.title === "MiniMax H3 Image to Video") {
                            const pw = n.widgets.find(w => w.name === "prompt") || n.widgets[0];
                            if (pw) {
                                pw.value = text;
                                if (pw.callback) pw.callback(text);
                            }
                        } else if (n.type === "CLIPTextEncode" && (n.title === "Positive Prompt" || n.title === "prompt")) {
                            const pw = n.widgets.find(w => w.name === "text") || n.widgets[0];
                            if (pw) {
                                pw.value = text;
                                if (pw.callback) pw.callback(text);
                            }
                        } else if (n.type === "TextEncodeQwenImageEdit" && n.title === "Positive Edit Prompt") {
                            const pw = n.widgets.find(w => w.name === "prompt") || n.widgets[0];
                            if (pw) {
                                pw.value = text;
                                if (pw.callback) pw.callback(text);
                            }
                        }
                    });
                }
            };

            promptInput.addEventListener("input", (e) => {
                setWidgetValue("prompt", e.target.value);
                handleMentionInput(e);
                updateActiveRefsUI();
                syncPromptToActiveNodes(e.target.value);
            });

            promptInput.addEventListener("change", (e) => {
                setWidgetValue("prompt", e.target.value);
                syncPromptToActiveNodes(e.target.value);
            });

            // Active References Preview Bar
            const activeRefsBar = document.createElement("div");
            activeRefsBar.className = "wox-active-refs-bar";

            const updateActiveRefsUI = () => {
                activeRefsBar.innerHTML = "";
                const text = promptInput.value || "";
                const seenTags = new Set();
                const matchedRefs = [];
                references.forEach(ref => {
                    if (text.includes(ref.tag) && !seenTags.has(ref.tag)) {
                        seenTags.add(ref.tag);
                        matchedRefs.push(ref);
                    }
                });

                if (matchedRefs.length > 0) {
                    activeRefsBar.classList.add("has-items");
                    matchedRefs.forEach(ref => {
                        const chip = document.createElement("div");
                        chip.className = "wox-active-ref-chip";
                        chip.innerHTML = `
                            <img src="${ref.url}" alt="${ref.tag}">
                            <span>${ref.tag}</span>
                            <button class="remove-ref-btn" title="Rimuovi dal prompt">✕</button>
                        `;
                        chip.querySelector(".remove-ref-btn").addEventListener("click", (e) => {
                            e.stopPropagation();
                            promptInput.value = promptInput.value.split(ref.tag).join("").replace(/\s+/g, " ").trim();
                            setWidgetValue("prompt", promptInput.value);
                            updateActiveRefsUI();
                        });
                        activeRefsBar.appendChild(chip);
                    });
                } else {
                    activeRefsBar.classList.remove("has-items");
                }
            };

            // =================================================================
            // @ MENTION AUTOCOMPLETE POPUP
            // =================================================================
            const mentionPopup = document.createElement("div");
            mentionPopup.className = "wox-mention-popup";
            mainBox.appendChild(mentionPopup);

            let mentionSelectedIndex = 0;
            let currentMentionQuery = null;

            const renderMentionList = (query = "") => {
                mentionPopup.innerHTML = `<div class="wox-mention-header">References (${references.length})</div>`;
                
                const filtered = references.filter(r => 
                    r.tag.toLowerCase().includes(query.toLowerCase()) || 
                    r.filename.toLowerCase().includes(query.toLowerCase())
                );

                if (filtered.length === 0) {
                    const empty = document.createElement("div");
                    empty.style.padding = "10px 8px";
                    empty.style.fontSize = "11px";
                    empty.style.color = "#64748b";
                    empty.innerText = references.length === 0 ? "Nessuna reference caricata. Clicca + per caricarne." : "Nessun tag trovato.";
                    mentionPopup.appendChild(empty);
                    mentionPopup.classList.add("visible");
                    return;
                }

                filtered.forEach((ref, idx) => {
                    const item = document.createElement("div");
                    item.className = `wox-mention-item ${idx === mentionSelectedIndex ? "selected" : ""}`;
                    
                    const thumb = document.createElement("img");
                    thumb.className = "wox-mention-thumb";
                    thumb.src = ref.url;
                    thumb.alt = ref.tag;

                    const info = document.createElement("div");
                    info.className = "wox-mention-info";
                    info.innerHTML = `
                        <div class="wox-mention-tag">${ref.tag}</div>
                        <div class="wox-mention-name">${ref.filename}</div>
                    `;

                    item.appendChild(thumb);
                    item.appendChild(info);

                    item.addEventListener("mousedown", (e) => {
                        e.preventDefault();
                        insertMentionTag(ref.tag);
                    });

                    mentionPopup.appendChild(item);
                });

                mentionPopup.classList.add("visible");
            };

            const insertMentionTag = (tag) => {
                const text = promptInput.value || "";
                
                // If tag is already present in prompt, don't duplicate it
                if (text.includes(tag)) {
                    mentionPopup.classList.remove("visible");
                    currentMentionQuery = null;
                    updateActiveRefsUI();
                    return;
                }

                const cursorPos = promptInput.selectionStart;
                const textBeforeCursor = text.slice(0, cursorPos);
                const lastAtIdx = textBeforeCursor.lastIndexOf("@");
                
                let newText = "";
                let newCursorPos = 0;
                
                if (lastAtIdx !== -1) {
                    newText = text.slice(0, lastAtIdx) + tag + " " + text.slice(cursorPos);
                    newCursorPos = lastAtIdx + tag.length + 1;
                } else {
                    newText = text ? (text.trim() + " " + tag + " ") : (tag + " ");
                    newCursorPos = newText.length;
                }
                
                promptInput.value = newText;
                setWidgetValue("prompt", newText);
                promptInput.focus();
                promptInput.setSelectionRange(newCursorPos, newCursorPos);
                
                mentionPopup.classList.remove("visible");
                currentMentionQuery = null;
                updateActiveRefsUI();
            };

            const handleMentionInput = (e) => {
                const text = promptInput.value;
                const cursorPos = promptInput.selectionStart;
                const textBefore = text.slice(0, cursorPos);
                const lastAtIdx = textBefore.lastIndexOf("@");

                if (lastAtIdx !== -1 && !/\s/.test(textBefore.slice(lastAtIdx + 1))) {
                    const query = textBefore.slice(lastAtIdx + 1);
                    currentMentionQuery = query;
                    mentionSelectedIndex = 0;
                    renderMentionList(query);
                } else {
                    mentionPopup.classList.remove("visible");
                    currentMentionQuery = null;
                }
            };

            promptInput.addEventListener("keydown", (e) => {
                if (!mentionPopup.classList.contains("visible")) return;

                const items = mentionPopup.querySelectorAll(".wox-mention-item");
                if (items.length === 0) return;

                if (e.key === "ArrowDown") {
                    e.preventDefault();
                    mentionSelectedIndex = (mentionSelectedIndex + 1) % items.length;
                    items.forEach((it, idx) => it.classList.toggle("selected", idx === mentionSelectedIndex));
                    items[mentionSelectedIndex]?.scrollIntoView({ block: "nearest" });
                } else if (e.key === "ArrowUp") {
                    e.preventDefault();
                    mentionSelectedIndex = (mentionSelectedIndex - 1 + items.length) % items.length;
                    items.forEach((it, idx) => it.classList.toggle("selected", idx === mentionSelectedIndex));
                    items[mentionSelectedIndex]?.scrollIntoView({ block: "nearest" });
                } else if (e.key === "Enter" || e.key === "Tab") {
                    e.preventDefault();
                    const filtered = references.filter(r => 
                        !currentMentionQuery || 
                        r.tag.toLowerCase().includes(currentMentionQuery.toLowerCase()) || 
                        r.filename.toLowerCase().includes(currentMentionQuery.toLowerCase())
                    );
                    if (filtered[mentionSelectedIndex]) {
                        insertMentionTag(filtered[mentionSelectedIndex].tag);
                    }
                } else if (e.key === "Escape") {
                    mentionPopup.classList.remove("visible");
                }
            });

            document.addEventListener("click", (e) => {
                if (!mainBox.contains(e.target)) {
                    mentionPopup.classList.remove("visible");
                }
            });

            // Action Bar
            const actionBar = document.createElement("div");
            actionBar.className = "wox-action-bar";

            const chipsRow = document.createElement("div");
            chipsRow.className = "wox-chips-row";

            const createChip = (text, className = "", onClick = null) => {
                const chip = document.createElement("div");
                chip.className = `wox-chip ${className}`;
                chip.innerText = text;
                if (onClick) {
                    chip.addEventListener("click", () => onClick(chip));
                }
                return chip;
            };

            // Keyframe State Variables
            let firstFrameRef = null;
            let lastFrameRef = null;
            let currentModalTarget = "mention"; // "mention" | "first_frame" | "last_frame"

            // Chips
            const chipAdd = createChip("+", "", () => {
                currentModalTarget = "mention";
                openRefModal("mention");
            });

            const chipAt = createChip("@", "", () => {
                // Focus and trigger autocomplete
                const cursorPos = promptInput.selectionStart;
                const text = promptInput.value;
                promptInput.value = text.slice(0, cursorPos) + "@" + text.slice(cursorPos);
                promptInput.focus();
                promptInput.setSelectionRange(cursorPos + 1, cursorPos + 1);
                setWidgetValue("prompt", promptInput.value);
                renderMentionList("");
            });

            // First Frame Chip
            const chipFrame = createChip("⊡", "wox-frame-chip", () => {
                currentModalTarget = "first_frame";
                openRefModal("first_frame");
            });
            chipFrame.title = "Imposta Fotogramma Iniziale (First Frame)";

            // Final Frame Chip
            const chipLastFrame = createChip("+ End", "wox-frame-chip", () => {
                currentModalTarget = "last_frame";
                openRefModal("last_frame");
            });
            chipLastFrame.title = "Imposta Fotogramma Finale (Last Frame)";
            chipLastFrame.style.display = "none";

            // Clear Keyframes Button (X)
            const chipClearFrames = createChip("✕", "wox-clear-frames-chip", () => {
                firstFrameRef = null;
                lastFrameRef = null;
                updateKeyframeChipsUI();
                if (currentMode.includes("Video")) {
                    syncOrBuildMiniMaxH3Pipeline();
                }
            });
            chipClearFrames.title = "Rimuovi fotogrammi iniziale e finale";
            chipClearFrames.style.display = "none";

            // Chips specifically for Image Mode (GUARDA, Edit)
            const chipWatch = createChip("👁 GUARDA", "wox-watch-chip", () => {
                if (recentImages && recentImages.length > 0) {
                    const latest = recentImages[0];
                    openImagePreviewModal({
                        url: latest.url,
                        filename: latest.filename || latest.name,
                        tag: latest.tag || "@zimage_image",
                        prompt: latest.prompt || promptInput.value
                    });
                } else {
                    openRefModal("mention", "All");
                }
            });
            chipWatch.title = "Visualizza l'anteprima dell'immagine generata (GUARDA)";
            chipWatch.style.display = "none";

            const chipEdit = createChip("✏️ Edit", "wox-edit-chip", () => {
                console.log("WOX Cinema: Edit image mode requested");
                if (recentImages && recentImages.length > 0) {
                    if (openImageEditModal) {
                        openImageEditModal({
                            url: recentImages[0].url,
                            filename: recentImages[0].filename || recentImages[0].name,
                            tag: recentImages[0].tag || "@zimage_image",
                            prompt: recentImages[0].prompt || promptInput?.value
                        });
                    }
                } else {
                    alert("Seleziona o genera prima un'immagine da modificare!");
                }
            });
            chipEdit.title = "Modifica immagine con Qwen-Image-Edit (Edit)";
            chipEdit.style.display = "none";

            updateChipsVisibilityForMode = () => {
                const isImg = currentMode.includes("Image");
                if (isImg) {
                    // In modalità IMMAGINE:
                    // Mostra +, @ per inserire reference sia come mention che dalla gallery
                    chipAdd.style.display = "inline-flex";
                    chipAt.style.display = "inline-flex";

                    // Nascondi controlli video: Imposta fotogramma iniziale, fotogramma finale, clear frames, durata (5s), audio (Audio: On)
                    chipFrame.style.display = "none";
                    chipLastFrame.style.display = "none";
                    chipClearFrames.style.display = "none";
                    chipDur.style.display = "none";
                    chipAudio.style.display = "none";

                    // Mostra controlli immagine: GUARDA (icona occhio) ed Edit
                    chipWatch.style.display = "inline-flex";
                    chipEdit.style.display = "inline-flex";
                } else {
                    // In modalità VIDEO nascondi:
                    // GUARDA ed Edit
                    chipWatch.style.display = "none";
                    chipEdit.style.display = "none";

                    // Mostra durata e audio
                    chipDur.style.display = "inline-flex";
                    chipAudio.style.display = "inline-flex";

                    // Gestisci fotogrammi e +, @ tramite updateKeyframeChipsUI
                    updateKeyframeChipsUI();
                }
            };

            const updateKeyframeChipsUI = () => {
                if (currentMode.includes("Image")) {
                    if (typeof updateChipsVisibilityForMode === "function") {
                        updateChipsVisibilityForMode();
                    }
                    return;
                }
                if (firstFrameRef) {
                    // Hide + and @
                    chipAdd.style.display = "none";
                    chipAt.style.display = "none";

                    // Show 1st Frame thumbnail inside chipFrame
                    chipFrame.style.display = "inline-flex";
                    chipFrame.innerHTML = `<img src="${firstFrameRef.url}" style="width:16px;height:16px;object-fit:cover;border-radius:3px;margin-right:4px;" /><span>1st</span>`;
                    chipFrame.title = `Fotogramma Iniziale: ${firstFrameRef.tag} (Clicca per cambiare)`;
                    chipFrame.classList.add("active-frame");

                    // Show Final Frame chip
                    chipLastFrame.style.display = "inline-flex";
                    if (lastFrameRef) {
                        chipLastFrame.innerHTML = `<img src="${lastFrameRef.url}" style="width:16px;height:16px;object-fit:cover;border-radius:3px;margin-right:4px;" /><span>End</span>`;
                        chipLastFrame.title = `Fotogramma Finale: ${lastFrameRef.tag} (Clicca per cambiare)`;
                        chipLastFrame.classList.add("active-frame");
                    } else {
                        chipLastFrame.innerHTML = `<span>+ End</span>`;
                        chipLastFrame.title = "Aggiungi Fotogramma Finale (Last Frame)";
                        chipLastFrame.classList.remove("active-frame");
                    }

                    // Show Clear X button
                    chipClearFrames.style.display = "inline-flex";
                } else {
                    // Restore original chips
                    chipAdd.style.display = "inline-flex";
                    chipAt.style.display = "inline-flex";
                    chipFrame.style.display = "inline-flex";
                    chipFrame.innerHTML = "⊡";
                    chipFrame.title = "Imposta Fotogramma Iniziale (First Frame)";
                    chipFrame.classList.remove("active-frame");
                    chipLastFrame.style.display = "none";
                    chipClearFrames.style.display = "none";
                }
            };

            const chipModel = createChip("⚡ Minimax H3 >", "model-chip", (el) => {
                if (currentMode.includes("Video")) {
                    updateModeUI("Image (Z-Image Turbo)");
                } else {
                    updateModeUI("Video (Minimax H3)");
                }
            });

            const updateResolutionNodesOnCanvas = () => {
                const resValue = resolution;
                let targetMegapixels = 0.98;
                if (resValue === "480p" || resValue === "480") targetMegapixels = 0.4;
                else if (resValue === "720p") targetMegapixels = 0.8;
                else if (resValue === "4k") targetMegapixels = 1.8;

                let targetAspect = "16:9 (Widescreen)";
                if (aspectRatio === "9:16") targetAspect = "9:16 (Vertical)";
                else if (aspectRatio === "1:1") targetAspect = "1:1 (Square)";
                else if (aspectRatio === "21:9") targetAspect = "21:9 (Cinematic)";
                else if (aspectRatio === "4:3") targetAspect = "4:3 (Standard)";

                if (app && app.graph && app.graph._nodes) {
                    for (const n of app.graph._nodes) {
                        if (n && n.type === "ResolutionSelector" && n.widgets) {
                            const megaW = n.widgets.find(w => w.name === "megapixels") || n.widgets[1];
                            if (megaW) {
                                megaW.value = targetMegapixels;
                                if (megaW.callback) megaW.callback(targetMegapixels);
                            }
                            const aspectW = n.widgets.find(w => w.name === "aspect_ratio") || n.widgets[0];
                            if (aspectW) {
                                aspectW.value = targetAspect;
                                if (aspectW.callback) aspectW.callback(targetAspect);
                            }
                            if (n.setDirtyCanvas) n.setDirtyCanvas(true, true);
                        }
                    }
                    if (app.graph.setDirtyCanvas) app.graph.setDirtyCanvas(true, true);
                    if (app.canvas && app.canvas.draw) app.canvas.draw(true, true);
                }
            };

            const resOptions = ["1080p", "720p", "480p", "4k"];
            const chipRes = createChip("1080p", "", (el) => {
                const next = resOptions[(resOptions.indexOf(el.innerText) + 1) % resOptions.length];
                el.innerText = next;
                resolution = next;
                setWidgetValue("resolution", next);
                updateResolutionNodesOnCanvas();
                if (currentMode && currentMode.includes("Video")) {
                    syncOrBuildMiniMaxH3Pipeline();
                } else {
                    syncOrBuildZImageTurboPipeline();
                }
            });

            const ratioOptions = ["16:9", "9:16", "1:1", "21:9"];
            const chipRatio = createChip("16:9", "", (el) => {
                const next = ratioOptions[(ratioOptions.indexOf(el.innerText) + 1) % ratioOptions.length];
                el.innerText = next;
                aspectRatio = next;
                setWidgetValue("aspect_ratio", next);
                updateResolutionNodesOnCanvas();
                if (currentMode && currentMode.includes("Video")) {
                    syncOrBuildMiniMaxH3Pipeline();
                } else {
                    syncOrBuildZImageTurboPipeline();
                }
            });

            const durOptions = ["5s", "10s"];
            const chipDur = createChip("5s", "", (el) => {
                const next = durOptions[(durOptions.indexOf(el.innerText) + 1) % durOptions.length];
                el.innerText = next;
                setWidgetValue("duration", parseInt(next));
            });

            const audioOptions = ["Audio: On", "Audio: Off"];
            const chipAudio = createChip("Audio: On", "", (el) => {
                const next = audioOptions[(audioOptions.indexOf(el.innerText) + 1) % audioOptions.length];
                el.innerText = next;
                setWidgetValue("audio", next.includes("On") ? "On" : "Off");
            });

            const varOptions = ["1/4", "2/4", "4/4"];
            const chipVar = createChip("1/4", "", (el) => {
                const next = varOptions[(varOptions.indexOf(el.innerText) + 1) % varOptions.length];
                el.innerText = next;
                const count = parseInt(next.split("/")[0]);
                setWidgetValue("variations", count);
            });

            chipsRow.appendChild(chipAdd);
            chipsRow.appendChild(chipAt);
            chipsRow.appendChild(chipFrame);
            chipsRow.appendChild(chipLastFrame);
            chipsRow.appendChild(chipClearFrames);
            chipsRow.appendChild(chipWatch);
            chipsRow.appendChild(chipEdit);
            chipsRow.appendChild(chipModel);
            chipsRow.appendChild(chipRes);
            chipsRow.appendChild(chipRatio);
            chipsRow.appendChild(chipDur);
            chipsRow.appendChild(chipAudio);
            chipsRow.appendChild(chipVar);

            // Applica la visibilità corretta in base alla modalità corrente
            updateChipsVisibilityForMode();

            // =================================================================
            // HIGH-RESOLUTION IMAGE PREVIEW LIGHTBOX MODAL
            // =================================================================
            const openImagePreviewModal = (mediaData) => {
                if (!mediaData || !mediaData.url) return;
                let previewBackdrop = document.querySelector(".wox-preview-backdrop");
                if (!previewBackdrop) {
                    previewBackdrop = document.createElement("div");
                    previewBackdrop.className = "wox-preview-backdrop";
                    document.body.appendChild(previewBackdrop);
                }

                const url = mediaData.url;
                const filename = mediaData.filename || mediaData.name || "Z_Image_Turbo_Generated.png";
                const tag = mediaData.tag || `@${filename.split(".")[0].replace(/[^a-zA-Z0-9_]/g, "_")}`;
                const isVideo = mediaData.media_type === "video" || (filename && filename.match(/\.(mp4|webm|mov|mkv|gif)$/i));
                const badgeText = isVideo ? "🎬 MINIMAX H3 AI VIDEO" : "⚡ Z-IMAGE TURBO AI IMAGE";
                const defaultPrompt = isVideo ? "Video cinematografico generato con MiniMax H3 in WOX Cinema Studio" : "Immagine generata con Z-Image Turbo in WOX Cinema Studio";
                const promptText = mediaData.prompt || promptInput?.value || defaultPrompt;

                const cacheBustUrl = url + (url.includes("?") ? `&_t=${Date.now()}` : `?_t=${Date.now()}`);

                previewBackdrop.innerHTML = `
                    <div class="wox-preview-modal">
                        <div class="wox-preview-header" style="display: flex; flex-direction: row; align-items: center; justify-content: space-between; flex-wrap: nowrap; gap: 12px;">
                            <div class="wox-preview-title" style="display: flex; align-items: center; gap: 10px; overflow: hidden; min-width: 0; flex: 1;">
                                <span class="wox-preview-badge" style="flex-shrink: 0;">${badgeText}</span>
                                <span class="wox-preview-filename" title="${filename}" style="overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0;">${filename}</span>
                            </div>
                            <div class="wox-preview-header-actions" style="display: flex; flex-direction: row; align-items: center; gap: 10px; flex-shrink: 0; flex-wrap: nowrap;">
                                <button class="wox-preview-btn-action" id="wox-preview-gallery-btn" title="Visualizza nella Media Gallery del popup" style="display: inline-flex; align-items: center; gap: 6px; white-space: nowrap; flex-shrink: 0; margin: 0;">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                                    Media Gallery
                                </button>
                                <button class="wox-preview-close" title="Chiudi (ESC)" style="display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0; margin: 0;">✕</button>
                            </div>
                        </div>
                        <div class="wox-preview-body">
                            ${isVideo ? `
                                <video src="${cacheBustUrl}" controls autoplay loop playsinline style="max-width: 86vw; max-height: 68vh; border-radius: 10px; box-shadow: 0 10px 30px rgba(0, 0, 0, 0.7); outline: none; background: #000;"></video>
                            ` : `
                                <img src="${cacheBustUrl}" alt="${filename}" class="wox-preview-main-img" />
                            `}
                        </div>
                        <div class="wox-preview-footer">
                            <div class="wox-preview-info">
                                <div class="wox-preview-prompt" title="${promptText}">"${promptText}"</div>
                                <div class="wox-preview-meta">Tag reference: <strong style="color:#d4ff32;">${tag}</strong></div>
                            </div>
                            <div class="wox-preview-actions">
                                ${!isVideo ? `
                                <button class="wox-preview-action-btn" id="wox-preview-edit-btn" style="background: rgba(212, 255, 50, 0.18); color: #d4ff32; border: 1px solid rgba(212, 255, 50, 0.45); font-weight: 700;">
                                    ✏️ Modifica con AI
                                </button>
                                ` : `
                                <button class="wox-preview-action-btn" id="wox-preview-add-timeline-btn" style="background: rgba(212, 255, 50, 0.18); color: #d4ff32; border: 1px solid rgba(212, 255, 50, 0.45); font-weight: 700;">
                                    🎞️ Aggiungi a Timeline
                                </button>
                                `}
                                <button class="wox-preview-action-btn primary" id="wox-preview-use-ref-btn">
                                    🏷️ Usa come Reference
                                </button>
                                <button class="wox-preview-action-btn secondary" id="wox-preview-new-tab-btn">
                                    ↗️ Apri Originale
                                </button>
                            </div>
                        </div>
                    </div>
                `;

                previewBackdrop.classList.add("open");

                const closePreview = () => {
                    const vidEl = previewBackdrop.querySelector("video");
                    if (vidEl) {
                        try { vidEl.pause(); } catch(e) {}
                    }
                    previewBackdrop.classList.remove("open");
                };

                previewBackdrop.querySelector(".wox-preview-close").addEventListener("click", closePreview);
                previewBackdrop.addEventListener("click", (e) => {
                    if (e.target === previewBackdrop) closePreview();
                });

                const escKeyHandler = (e) => {
                    if (e.key === "Escape") {
                        closePreview();
                        window.removeEventListener("keydown", escKeyHandler);
                    }
                };
                window.addEventListener("keydown", escKeyHandler);

                // Button: Open Media Gallery Popup on Generations tab
                const galleryBtn = previewBackdrop.querySelector("#wox-preview-gallery-btn");
                if (galleryBtn) {
                    galleryBtn.addEventListener("click", () => {
                        closePreview();
                        openRefModal("mention", "Generations");
                    });
                }

                // Button: Edit Image with Qwen-Image-Edit
                const editBtn = previewBackdrop.querySelector("#wox-preview-edit-btn");
                if (editBtn) {
                    editBtn.addEventListener("click", () => {
                        closePreview();
                        if (openImageEditModal) {
                            openImageEditModal(mediaData);
                        }
                    });
                }

                // Button: Add Video to Timeline
                const addTimelineBtn = previewBackdrop.querySelector("#wox-preview-add-timeline-btn");
                if (addTimelineBtn) {
                    addTimelineBtn.addEventListener("click", () => {
                        addClipToTimeline({
                            url: url,
                            filename: filename,
                            title: tag || filename
                        });
                        closePreview();
                    });
                }

                // Button: Use as reference in prompt
                const useRefBtn = previewBackdrop.querySelector("#wox-preview-use-ref-btn");
                if (useRefBtn) {
                    useRefBtn.addEventListener("click", () => {
                        insertMentionTag(tag);
                        closePreview();
                    });
                }

                // Button: Open in new tab
                const newTabBtn = previewBackdrop.querySelector("#wox-preview-new-tab-btn");
                if (newTabBtn) {
                    newTabBtn.addEventListener("click", () => {
                        window.open(url, "_blank");
                    });
                }
            };

            // =================================================================
            // QWEN IMAGE EDIT MODAL POPUP (AI IMAGE INPAINT / EDIT)
            // =================================================================
            openImageEditModal = (mediaData) => {
                if (!mediaData || !mediaData.url) {
                    if (recentImages && recentImages.length > 0) {
                        mediaData = recentImages[0];
                    } else {
                        alert("Nessuna immagine selezionata da modificare.");
                        return;
                    }
                }

                let editBackdrop = document.querySelector(".wox-edit-backdrop");
                if (!editBackdrop) {
                    editBackdrop = document.createElement("div");
                    editBackdrop.className = "wox-edit-backdrop";
                    document.body.appendChild(editBackdrop);
                }

                let currentMedia = { ...mediaData };
                const initialUrl = currentMedia.url;
                const cacheBustUrl = initialUrl + (initialUrl.includes("?") ? `&_t=${Date.now()}` : `?_t=${Date.now()}`);
                const filename = currentMedia.filename || currentMedia.name || "immagine_input.png";
                const tag = currentMedia.tag || `@${filename.split(".")[0].replace(/[^a-zA-Z0-9_]/g, "_")}`;

                editBackdrop.innerHTML = `
                    <div class="wox-edit-modal">
                        <div class="wox-edit-header">
                            <div class="wox-edit-header-title">
                                <span class="wox-edit-header-badge">✏️ QWEN IMAGE EDIT (LIGHTNING 4-STEPS)</span>
                                <span class="wox-edit-header-filename" id="wox-edit-header-filename" title="${filename}">${filename}</span>
                            </div>
                            <button class="wox-edit-close" id="wox-edit-close-btn" title="Chiudi (ESC)">✕</button>
                        </div>
                        <div class="wox-edit-body">
                            <div class="wox-edit-preview-col">
                                <div class="wox-edit-img-wrap">
                                    <img id="wox-edit-preview-img" src="${cacheBustUrl}" alt="${filename}" />
                                    <div class="wox-edit-spinner-overlay" id="wox-edit-spinner" style="display: none;">
                                        <div class="wox-edit-spinner-ring"></div>
                                        <div class="wox-edit-spinner-text">
                                            Modifica con Qwen-Image-Edit in corso...<br>
                                            <span style="font-size:11px;opacity:0.75;font-weight:400;">4-steps Lightning LoRA (Euler / Simple)</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="wox-edit-meta-row">
                                    <span id="wox-edit-tag-label">Reference: <strong style="color:#d4ff32;">${tag}</strong></span>
                                    <span id="wox-edit-version-label" style="opacity:0.7;">Originale</span>
                                </div>
                            </div>
                            <div class="wox-edit-controls-col">
                                <div class="wox-edit-section-label">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 20h9"></path><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"></path></svg>
                                    Descrivi la modifica da apportare all'immagine
                                </div>
                                <textarea class="wox-edit-prompt-input" id="wox-edit-prompt-input" placeholder="Es: Cambia l'espressione e rendila felice con un sorriso radioso... oppure: Aggiungi @hero con occhiali da sole..."></textarea>
                                
                                <!-- Reference Picker Section in Edit Modal -->
                                <div class="wox-edit-refs-section">
                                    <div style="display: flex; align-items: center; justify-content: space-between;">
                                        <div class="wox-edit-section-label" style="margin-bottom: 0;">
                                            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"></path></svg>
                                            Reference collegate
                                        </div>
                                        <button type="button" class="wox-edit-add-ref-btn" id="wox-edit-add-ref-btn" title="Scegli una reference dalla Media Gallery">
                                            + Scegli Reference
                                        </button>
                                    </div>
                                    <div class="wox-edit-active-refs" id="wox-edit-active-refs"></div>
                                </div>

                                <div class="wox-edit-quick-chips">
                                    <button class="wox-edit-chip-btn" data-chip="Cambia l'espressione e rendila felice con un sorriso radioso">😄 Espressione felice</button>
                                    <button class="wox-edit-chip-btn" data-chip="Aggiungi occhiali da sole scuri stile aviatore">🕶️ Occhiali da sole</button>
                                    <button class="wox-edit-chip-btn" data-chip="Cambia l'abito in uno smoking scuro molto elegante">👔 Abito elegante</button>
                                    <button class="wox-edit-chip-btn" data-chip="Rimuovi tutti gli elementi di testo, loghi e scritte dall'immagine">🧹 Rimuovi scritte e loghi</button>
                                    <button class="wox-edit-chip-btn" data-chip="Aggiungi pioggia battente, riflessi bagnati e luci al neon riflesse">🌧️ Pioggia & Neon</button>
                                    <button class="wox-edit-chip-btn" data-chip="Cambia lo sfondo in un tramonto dorato spettacolare sul mare">🌅 Tramonto dorato</button>
                                </div>

                                <div class="wox-edit-pipeline-box">
                                    <strong>Pipeline Qwen-Image-Edit (Lightning):</strong><br>
                                    Qwen-Image-Edit FP8 + 4-Steps Lightning LoRA (Euler / Simple, CFG 1.0, AuraFlow Shift 3.0). Generazione rapida in 4 passi.
                                </div>

                                <div class="wox-edit-actions">
                                    <button class="wox-edit-gen-btn" id="wox-edit-submit-btn">
                                        ✨ GENERA MODIFICA
                                    </button>
                                    <div class="wox-edit-status-msg" id="wox-edit-status"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

                editBackdrop.classList.add("open");

                const closeEdit = () => {
                    editBackdrop.classList.remove("open");
                    if (currentEditSession) currentEditSession.active = false;
                    window._woxInsertEditReference = null;
                };

                const closeBtn = editBackdrop.querySelector("#wox-edit-close-btn");
                if (closeBtn) closeBtn.addEventListener("click", closeEdit);

                editBackdrop.addEventListener("click", (e) => {
                    if (e.target === editBackdrop) closeEdit();
                });

                const escKeyEditHandler = (e) => {
                    if (e.key === "Escape") {
                        closeEdit();
                        window.removeEventListener("keydown", escKeyEditHandler);
                    }
                };
                window.addEventListener("keydown", escKeyEditHandler);

                const editPromptInput = editBackdrop.querySelector("#wox-edit-prompt-input");
                const previewImg = editBackdrop.querySelector("#wox-edit-preview-img");
                const spinner = editBackdrop.querySelector("#wox-edit-spinner");
                const submitBtn = editBackdrop.querySelector("#wox-edit-submit-btn");
                const statusMsg = editBackdrop.querySelector("#wox-edit-status");
                const filenameLabel = editBackdrop.querySelector("#wox-edit-header-filename");
                const versionLabel = editBackdrop.querySelector("#wox-edit-version-label");
                const tagLabel = editBackdrop.querySelector("#wox-edit-tag-label");
                const activeRefsContainer = editBackdrop.querySelector("#wox-edit-active-refs");
                const addRefBtn = editBackdrop.querySelector("#wox-edit-add-ref-btn");

                let activeEditRefs = [];

                const renderActiveEditRefs = () => {
                    if (!activeRefsContainer) return;
                    activeRefsContainer.innerHTML = "";
                    if (activeEditRefs.length === 0) {
                        activeRefsContainer.innerHTML = `<span style="font-size:10px; color:#64748b; font-style:italic;">Nessuna reference selezionata. Clicca "+ Scegli Reference" per aggiungerne una.</span>`;
                        return;
                    }
                    activeEditRefs.forEach(ref => {
                        const chip = document.createElement("div");
                        chip.className = "wox-edit-ref-chip";
                        chip.innerHTML = `
                            <img src="${ref.url}" alt="${ref.tag || ''}" />
                            <span class="wox-edit-ref-chip-tag">${ref.tag || ref.filename}</span>
                            <button type="button" class="wox-edit-ref-chip-del" title="Rimuovi reference">✕</button>
                        `;
                        chip.querySelector(".wox-edit-ref-chip-del").addEventListener("click", (e) => {
                            e.stopPropagation();
                            activeEditRefs = activeEditRefs.filter(r => r !== ref);
                            if (ref.tag) {
                                editPromptInput.value = editPromptInput.value.replace(new RegExp(ref.tag + "\\b", "g"), "").replace(/\s+/g, " ").trim();
                            }
                            renderActiveEditRefs();
                        });
                        activeRefsContainer.appendChild(chip);
                    });
                };

                window._woxInsertEditReference = (ref) => {
                    if (!ref) return;
                    const tag = ref.tag || `@${(ref.raw_filename || ref.filename).split('.')[0].replace(/[^a-zA-Z0-9_]/g, '_')}`;
                    ref.tag = tag;
                    if (!activeEditRefs.find(r => r.tag === tag || r.filename === ref.filename)) {
                        activeEditRefs.push(ref);
                    }
                    if (!editPromptInput.value.includes(tag)) {
                        if (editPromptInput.value.trim()) {
                            editPromptInput.value += ` ${tag}`;
                        } else {
                            editPromptInput.value = `${tag} `;
                        }
                    }
                    renderActiveEditRefs();
                    editPromptInput.focus();
                };

                if (addRefBtn) {
                    addRefBtn.addEventListener("click", () => {
                        openRefModal("edit_modal", "All");
                    });
                }

                renderActiveEditRefs();

                // Quick chips click
                const chipBtns = editBackdrop.querySelectorAll(".wox-edit-chip-btn");
                chipBtns.forEach(btn => {
                    btn.addEventListener("click", () => {
                        const text = btn.getAttribute("data-chip");
                        if (editPromptInput.value.trim()) {
                            editPromptInput.value += `, ${text}`;
                        } else {
                            editPromptInput.value = text;
                        }
                        editPromptInput.focus();
                    });
                });

                // Active edit session reference
                currentEditSession = {
                    active: true,
                    mediaData: currentMedia,
                    updateImage: (newUrl, newFilename) => {
                        currentMedia.url = newUrl;
                        currentMedia.filename = newFilename;
                        previewImg.src = newUrl;
                        filenameLabel.textContent = newFilename;
                        filenameLabel.title = newFilename;
                        const newTag = `@${newFilename.split(".")[0].replace(/[^a-zA-Z0-9_]/g, "_")}`;
                        currentMedia.tag = newTag;
                        if (tagLabel) tagLabel.innerHTML = `Reference: <strong style="color:#d4ff32;">${newTag}</strong>`;
                        if (versionLabel) versionLabel.textContent = "✨ Modificato con AI";
                        if (spinner) spinner.style.display = "none";
                        if (submitBtn) {
                            submitBtn.disabled = false;
                            submitBtn.innerHTML = `✨ GENERA ALTRA MODIFICA`;
                        }
                        if (statusMsg) {
                            statusMsg.className = "wox-edit-status-msg success";
                            statusMsg.textContent = "✅ Immagine modificata con successo!";
                        }
                    },
                    onError: (err) => {
                        if (spinner) spinner.style.display = "none";
                        if (submitBtn) {
                            submitBtn.disabled = false;
                            submitBtn.innerHTML = `✨ GENERA MODIFICA`;
                        }
                        if (statusMsg) {
                            statusMsg.className = "wox-edit-status-msg error";
                            statusMsg.textContent = `❌ Errore: ${err}`;
                        }
                    }
                };

                // Generate modification button handler
                submitBtn.addEventListener("click", async () => {
                    const promptText = editPromptInput.value.trim();
                    if (!promptText) {
                        alert("Inserisci una descrizione della modifica che vuoi apportare.");
                        editPromptInput.focus();
                        return;
                    }

                    submitBtn.disabled = true;
                    submitBtn.innerHTML = `<span>⏳ GENERAZIONE IN CORSO...</span>`;
                    if (spinner) spinner.style.display = "flex";
                    if (statusMsg) {
                        statusMsg.className = "wox-edit-status-msg";
                        statusMsg.textContent = "Preparazione immagine ed esecuzione workflow Qwen-Image-Edit...";
                    }

                    try {
                        // 1. Prepare image in input directory for LoadImage
                        // Uses native ComfyUI /upload/image endpoint (no server restart required!)
                        let inputFilename = null;

                        try {
                            const imgBlobRes = await fetch(currentMedia.url);
                            if (imgBlobRes.ok) {
                                const blob = await imgBlobRes.blob();
                                const formData = new FormData();
                                const rawName = currentMedia.filename || currentMedia.name || "edit_source.png";
                                const cleanName = rawName.replace(/[^a-zA-Z0-9._-]/g, "_");
                                const targetName = `wox_edit_${Date.now()}_${cleanName}`;
                                formData.append("image", blob, targetName);
                                formData.append("overwrite", "true");

                                const uploadRes = await fetch("/upload/image", {
                                    method: "POST",
                                    body: formData
                                });
                                
                                if (uploadRes.ok) {
                                    const uploadData = await uploadRes.json();
                                    inputFilename = uploadData.name || targetName;
                                }
                            }
                        } catch (uploadErr) {
                            console.warn("Direct blob upload to /upload/image failed:", uploadErr);
                        }

                        // Fallback to /wox_cinema/prepare_edit_input if needed
                        if (!inputFilename) {
                            const prepRes = await fetch("/wox_cinema/prepare_edit_input", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    filename: currentMedia.filename || currentMedia.name || "",
                                    subfolder: currentMedia.subfolder || "",
                                    url: currentMedia.url || ""
                                })
                            });
                            if (!prepRes.ok) {
                                const text = await prepRes.text();
                                throw new Error(`Errore server (${prepRes.status}): ${text || "Endpoint non raggiungibile"}`);
                            }
                            const prepData = await prepRes.json();
                            if (!prepData.success || !prepData.input_filename) {
                                throw new Error(prepData.error || "Impossibile preparare l'immagine per l'editing.");
                            }
                            inputFilename = prepData.input_filename;
                        }

                        console.log("WOX Cinema: Image prepared for editing:", inputFilename);

                        // 2. Build canvas pipeline with Qwen-Image-Edit Lightning 4-steps
                        if (syncOrBuildQwenImageEditPipeline) {
                            syncOrBuildQwenImageEditPipeline(inputFilename, promptText);
                        } else {
                            throw new Error("Pipeline Qwen-Image-Edit non inizializzata.");
                        }

                        // 3. Queue prompt on ComfyUI (the popup stays OPEN!)
                        if (app && app.queuePrompt) {
                            await app.queuePrompt(0);
                        }
                    } catch (err) {
                        console.error("WOX Cinema Edit Error:", err);
                        currentEditSession.onError(err.message || String(err));
                    }
                });
            };

            // =================================================================
            // REFERENCE MANAGER MODAL POPUP DOM (MEDIA GALLERY)
            // =================================================================
            let modalBackdrop = document.querySelector(".wox-modal-backdrop");
            if (!modalBackdrop) {
                modalBackdrop = document.createElement("div");
                modalBackdrop.className = "wox-modal-backdrop";
                document.body.appendChild(modalBackdrop);
            }

            const openRefModal = async (targetType = "mention", initialCategory = null) => {
                currentModalTarget = targetType;
                activeRefCategory = initialCategory || activeRefCategory || "All";
                await fetchReferences();
                modalBackdrop.innerHTML = `
                    <div class="wox-modal">
                        <!-- 1. Header Tabs -->
                        <div class="wox-modal-header">
                            <div class="wox-modal-tabs">
                                <button class="wox-tab-btn ${activeRefCategory === "All" ? "active" : ""}" data-tab="All">All</button>
                                <button class="wox-tab-btn ${activeRefCategory === "Generations" ? "active" : ""}" data-tab="Generations">Generations</button>
                                <button class="wox-tab-btn ${activeRefCategory === "Uploads" ? "active" : ""}" data-tab="Uploads">Uploads</button>
                                <button class="wox-tab-btn ${activeRefCategory === "Elements" ? "active" : ""}" data-tab="Elements">Elements</button>
                                <button class="wox-tab-btn ${activeRefCategory === "Liked" ? "active" : ""}" data-tab="Liked">Liked</button>
                            </div>
                            <button class="wox-modal-close" title="Chiudi">✕</button>
                        </div>

                        <!-- 2. Sub-Bar Filters -->
                        <div class="wox-modal-subbar">
                            <div class="wox-filter-pills">
                                <button class="wox-subbar-pill ${activeRefFilter === "Recent" ? "active" : ""}" data-filter="Recent">Recent</button>
                                <button class="wox-subbar-pill ${activeRefFilter === "All" ? "active" : ""}" data-filter="All">All</button>
                                <button class="wox-subbar-pill ${activeRefFilter === "Images" ? "active" : ""}" data-filter="Images">Images</button>
                                <button class="wox-subbar-pill ${activeRefFilter === "Videos" ? "active" : ""}" data-filter="Videos">Videos</button>
                                <button class="wox-subbar-pill ${activeRefFilter === "Audio" ? "active" : ""}" data-filter="Audio">Audio</button>
                            </div>
                            <div class="wox-sort-btn">☰ Sort by ▾</div>
                        </div>

                        <!-- 3. Grid Content -->
                        <div class="wox-modal-body">
                            <div class="wox-ref-grid" id="wox-ref-grid-container"></div>
                        </div>
                    </div>
                `;

                modalBackdrop.classList.add("open");

                // Close handlers
                modalBackdrop.querySelector(".wox-modal-close").addEventListener("click", () => {
                    modalBackdrop.classList.remove("open");
                });
                modalBackdrop.addEventListener("click", (e) => {
                    if (e.target === modalBackdrop) modalBackdrop.classList.remove("open");
                });

                // Tab handlers
                modalBackdrop.querySelectorAll(".wox-tab-btn").forEach(btn => {
                    btn.addEventListener("click", () => {
                        modalBackdrop.querySelectorAll(".wox-tab-btn").forEach(b => b.classList.remove("active"));
                        btn.classList.add("active");
                        activeRefCategory = btn.dataset.tab;
                        renderRefModalGrid();
                    });
                });

                // Filter handlers
                modalBackdrop.querySelectorAll(".wox-subbar-pill").forEach(pill => {
                    pill.addEventListener("click", () => {
                        modalBackdrop.querySelectorAll(".wox-subbar-pill").forEach(p => p.classList.remove("active"));
                        pill.classList.add("active");
                        activeRefFilter = pill.dataset.filter;
                        renderRefModalGrid();
                    });
                });

                renderRefModalGrid();
            };

            const renderRefModalGrid = () => {
                const gridContainer = modalBackdrop.querySelector("#wox-ref-grid-container");
                if (!gridContainer) return;

                gridContainer.innerHTML = "";

                // 1. Upload Card (mostrata in All o Uploads)
                if (activeRefCategory === "All" || activeRefCategory === "Uploads") {
                    const uploadCard = document.createElement("div");
                    uploadCard.className = "wox-upload-card";
                    uploadCard.innerHTML = `
                        <div class="wox-upload-icon-wrap">☁</div>
                        <div class="wox-upload-title">Upload media</div>
                        <div class="wox-upload-sub">Protected content is not allowed</div>
                        <input type="file" multiple accept="image/*,video/*,audio/*" style="display:none;" id="wox-file-input">
                    `;

                    const fileInput = uploadCard.querySelector("#wox-file-input");
                    uploadCard.addEventListener("click", (e) => {
                        if (e.target !== fileInput) {
                            fileInput.click();
                        }
                    });
                    fileInput.addEventListener("click", (e) => {
                        e.stopPropagation();
                    });

                    // Drag & drop upload onto upload card
                    uploadCard.addEventListener("dragover", (e) => { e.preventDefault(); uploadCard.style.borderColor = "#d4ff32"; });
                    uploadCard.addEventListener("dragleave", () => { uploadCard.style.borderColor = ""; });
                    uploadCard.addEventListener("drop", (e) => {
                        e.preventDefault();
                        uploadCard.style.borderColor = "";
                        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                            uploadFiles(e.dataTransfer.files);
                        }
                    });

                    fileInput.addEventListener("change", (e) => {
                        if (e.target.files && e.target.files.length > 0) {
                            uploadFiles(e.target.files);
                        }
                    });

                    gridContainer.appendChild(uploadCard);
                }

                // Filter references by Category Tab
                let items = [...references];
                if (activeRefCategory === "Generations") {
                    items = items.filter(r => r.category === "Generations");
                } else if (activeRefCategory === "Uploads") {
                    items = items.filter(r => r.category === "Uploads" || !r.category);
                } else if (activeRefCategory === "Elements") {
                    items = items.filter(r => r.category === "Elements");
                } else if (activeRefCategory === "Liked") {
                    items = items.filter(r => r.liked);
                }

                // Filter by Sub-Bar Pill
                if (activeRefFilter === "Images") items = items.filter(r => r.media_type === "image");
                else if (activeRefFilter === "Videos") items = items.filter(r => r.media_type === "video");
                else if (activeRefFilter === "Audio") items = items.filter(r => r.media_type === "audio");
                
                // Ordina per timestamp decrescente (più recenti prima)
                if (activeRefFilter === "Recent" || activeRefCategory === "All") {
                    items.sort((a, b) => (b.time || 0) - (a.time || 0));
                }

                if (activeRefCategory === "Generations" && items.length === 0) {
                    const emptyNotice = document.createElement("div");
                    emptyNotice.style.gridColumn = "1 / -1";
                    emptyNotice.style.textAlign = "center";
                    emptyNotice.style.padding = "40px 20px";
                    emptyNotice.style.color = "#94a3b8";
                    const isVidFilter = activeRefFilter === "Videos";
                    emptyNotice.innerHTML = `
                        <div style="font-size:32px;margin-bottom:10px;">${isVidFilter ? "🎬" : "⚡"}</div>
                        <div style="font-size:15px;font-weight:700;color:#f1f5f9;margin-bottom:6px;">${isVidFilter ? "Nessun video generato trovato" : "Nessun contenuto generato trovato"}</div>
                        <div style="font-size:12px;color:#64748b;">${isVidFilter ? "Seleziona la modalità <strong>Video</strong> e premi <strong>GENERATE</strong> per creare clip cinematografiche con MiniMax H3." : "Genera immagini o video con WOX Cinema Studio per visualizzarli qui."}</div>
                    `;
                    gridContainer.appendChild(emptyNotice);
                }

                // 2. Reference Cards
                items.forEach((ref) => {
                    const card = document.createElement("div");
                    card.className = "wox-ref-card";
                    
                    const isVid = ref.media_type === "video" || (ref.filename && ref.filename.match(/\.(mp4|webm|mov|mkv|gif)$/i));
                    let thumb;
                    if (isVid) {
                        thumb = document.createElement("video");
                        thumb.className = "wox-ref-thumb";
                        const vidUrl = ref.url.includes("#") ? ref.url : `${ref.url}#t=0.001`;
                        thumb.src = vidUrl;
                        thumb.muted = true;
                        thumb.defaultMuted = true;
                        thumb.loop = true;
                        thumb.playsInline = true;
                        thumb.preload = "auto";
                        // Play on hover, pause on leave
                        card.addEventListener("mouseenter", () => {
                            const p = thumb.play();
                            if (p && typeof p.catch === "function") p.catch(() => {});
                        });
                        card.addEventListener("mouseleave", () => {
                            thumb.pause();
                        });
                    } else {
                        thumb = document.createElement("img");
                        thumb.className = "wox-ref-thumb";
                        thumb.src = ref.url;
                        thumb.alt = ref.tag;
                    }
                    if (ref.prompt) thumb.title = ref.prompt;

                    // Play icon indicator for videos
                    if (isVid) {
                        const playIcon = document.createElement("div");
                        playIcon.className = "wox-ref-video-indicator";
                        playIcon.innerHTML = "▶";
                        card.appendChild(playIcon);
                    }

                    // Preview Button (👁️) in alto a sinistra della card
                    const prevBtn = document.createElement("button");
                    prevBtn.className = "wox-ref-preview-btn";
                    prevBtn.innerHTML = "👁";
                    prevBtn.title = "Visualizza preview ingrandita";
                    prevBtn.addEventListener("click", (e) => {
                        e.stopPropagation();
                        openImagePreviewModal({
                            url: ref.url,
                            filename: ref.raw_filename || ref.filename,
                            tag: ref.tag,
                            prompt: ref.prompt,
                            media_type: ref.media_type
                        });
                    });
                    card.appendChild(prevBtn);

                    // Edit Button (✏️) solo per immagini
                    if (!isVid) {
                        const editCardBtn = document.createElement("button");
                        editCardBtn.className = "wox-ref-preview-btn";
                        editCardBtn.style.left = "38px";
                        editCardBtn.innerHTML = "✏️";
                        editCardBtn.title = "Modifica immagine con Qwen-Image-Edit";
                        editCardBtn.addEventListener("click", (e) => {
                            e.stopPropagation();
                            modalBackdrop.classList.remove("open");
                            if (typeof openImageEditModal === "function") {
                                openImageEditModal({
                                    url: ref.url,
                                    filename: ref.raw_filename || ref.filename,
                                    tag: ref.tag,
                                    prompt: ref.prompt
                                });
                            }
                        });
                        card.appendChild(editCardBtn);
                    } else {
                        // Timeline Button (🎞️) per i video
                        const tlCardBtn = document.createElement("button");
                        tlCardBtn.className = "wox-ref-preview-btn";
                        tlCardBtn.style.left = "38px";
                        tlCardBtn.innerHTML = "🎞️";
                        tlCardBtn.title = "Aggiungi questo video alla timeline";
                        tlCardBtn.addEventListener("click", (e) => {
                            e.stopPropagation();
                            addClipToTimeline({
                                url: ref.url,
                                filename: ref.filename,
                                title: ref.tag || ref.filename
                            });
                        });
                        card.appendChild(tlCardBtn);
                    }

                    // Badge se è un'immagine o video generato
                    if (isVid) {
                        const badge = document.createElement("div");
                        badge.className = "wox-ref-badge video-badge";
                        badge.innerText = "MINIMAX VIDEO";
                        card.appendChild(badge);
                    } else if (ref.category === "Generations" || ref.is_generation || (ref.raw_filename && (ref.raw_filename.toLowerCase().includes("z_image") || ref.raw_filename.toLowerCase().includes("zimage") || ref.raw_filename.toLowerCase().includes("krea")))) {
                        const badge = document.createElement("div");
                        badge.className = "wox-ref-badge";
                        badge.innerText = "Z-IMAGE";
                        card.appendChild(badge);
                    }

                    const info = document.createElement("div");
                    info.className = "wox-ref-info";

                    const tagSpan = document.createElement("div");
                    tagSpan.className = "wox-ref-tag";
                    tagSpan.innerText = ref.tag;
                    tagSpan.title = "Clicca per modificare il tag";

                    // Inline Tag Editing
                    tagSpan.addEventListener("click", async (e) => {
                        e.stopPropagation();
                        const newTag = prompt("Inserisci il nuovo tag per questa reference (es. @hero):", ref.tag);
                        if (newTag && newTag.trim()) {
                            try {
                                await fetch("/wox_cinema/references/update_tag", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({ filename: ref.filename, tag: newTag.trim() })
                                });
                                fetchReferences();
                            } catch (err) {
                                console.log("Failed to update tag", err);
                            }
                        }
                    });

                    const delBtn = document.createElement("button");
                    delBtn.className = "wox-ref-delete-btn";
                    delBtn.innerHTML = "✕";
                    delBtn.title = "Elimina reference";
                    delBtn.addEventListener("click", async (e) => {
                        e.stopPropagation();
                        const raw = ref.raw_filename || (ref.filename ? ref.filename.replace("woxcinema/", "") : "");
                        if (confirm(`Eliminare definitivamente "${ref.tag || ref.filename}"?`)) {
                            // 1. Immediately record in persistent deleted set to stop resurrection and flashes
                            addDeletedRef(ref.filename, raw);

                            // 2. Immediately remove from DOM and local state
                            card.remove();
                            references = references.filter(r => {
                                const rFn = (r.filename || "").toLowerCase();
                                const rRaw = (r.raw_filename || "").toLowerCase();
                                return rFn !== (ref.filename || "").toLowerCase() && rRaw !== raw.toLowerCase() && rFn !== raw.toLowerCase();
                            });
                            recentImages = recentImages.filter(r => {
                                const rFn = (r.filename || "").toLowerCase();
                                return rFn !== (ref.filename || "").toLowerCase() && rFn !== raw.toLowerCase();
                            });
                            pillRefs.updateVal(`${references.length}/50`);
                            updateActiveRefsUI();
                            renderGallery();

                            // 3. Inform backend to delete from disk
                            try {
                                await fetch("/wox_cinema/references/delete", {
                                    method: "POST",
                                    headers: { "Content-Type": "application/json" },
                                    body: JSON.stringify({
                                        filename: ref.filename,
                                        raw_filename: raw,
                                        url: ref.url
                                    })
                                });
                            } catch (err) {
                                console.log("Failed to delete reference on server:", err);
                            }
                        }
                    });

                    info.appendChild(tagSpan);
                    card.appendChild(thumb);
                    card.appendChild(info);
                    card.appendChild(delBtn);

                    // Clicking card handles selection depending on currentModalTarget
                    card.addEventListener("click", () => {
                        if (currentModalTarget === "first_frame") {
                            firstFrameRef = ref;
                            updateKeyframeChipsUI();
                            if (currentMode.includes("Video")) {
                                syncOrBuildMiniMaxH3Pipeline();
                            }
                        } else if (currentModalTarget === "last_frame") {
                            lastFrameRef = ref;
                            updateKeyframeChipsUI();
                            if (currentMode.includes("Video")) {
                                syncOrBuildMiniMaxH3Pipeline();
                            }
                        } else if (currentModalTarget === "timeline_clip") {
                            addClipToTimeline({
                                url: ref.url,
                                filename: ref.filename,
                                title: ref.tag || ref.filename
                            });
                        } else if (currentModalTarget === "edit_modal") {
                            if (window._woxInsertEditReference) {
                                window._woxInsertEditReference(ref);
                            }
                        } else {
                            if (isVid) {
                                openImagePreviewModal({
                                    url: ref.url,
                                    filename: ref.raw_filename || ref.filename,
                                    tag: ref.tag,
                                    prompt: ref.prompt,
                                    media_type: "video"
                                });
                                return;
                            }
                            insertMentionTag(ref.tag);
                        }
                        modalBackdrop.classList.remove("open");
                    });

                    gridContainer.appendChild(card);
                });
            };

            const uploadFiles = async (fileList) => {
                const formData = new FormData();
                for (let i = 0; i < fileList.length; i++) {
                    formData.append("image", fileList[i]);
                }
                try {
                    const res = await fetch("/wox_cinema/references/upload", {
                        method: "POST",
                        body: formData
                    });
                    if (res.ok) {
                        fetchReferences();
                    }
                } catch (err) {
                    console.log("Upload error:", err);
                }
            };

            // Fetch initial references on load
            fetchReferences();

            // Helper to build/sync ResolutionSelector -> MiniMax H3 -> SaveVideo pipeline (with Auto-Switch for References)
            const syncOrBuildMiniMaxH3Pipeline = () => {
                // Safe connection helper
                const safeConnect = (srcNode, srcNameOrIdx, tgtNode, tgtNameOrIdx) => {
                    if (!srcNode || !tgtNode) return;
                    try {
                        let srcSlot = -1;
                        if (typeof srcNameOrIdx === "number") {
                            srcSlot = srcNameOrIdx;
                        } else if (srcNode.findOutputSlot) {
                            srcSlot = srcNode.findOutputSlot(srcNameOrIdx);
                        }
                        if (srcSlot === -1 && srcNode.outputs) {
                            const query = String(srcNameOrIdx).toLowerCase();
                            srcSlot = srcNode.outputs.findIndex(o => o.name?.toLowerCase() === query || o.type?.toLowerCase() === query);
                        }
                        if (srcSlot === -1) srcSlot = 0;

                        let tgtSlot = -1;
                        if (typeof tgtNameOrIdx === "number") {
                            tgtSlot = tgtNameOrIdx;
                        } else if (tgtNode.findInputSlot) {
                            tgtSlot = tgtNode.findInputSlot(tgtNameOrIdx);
                        }
                        if (tgtSlot === -1 && tgtNode.inputs) {
                            const query = String(tgtNameOrIdx).toLowerCase();
                            tgtSlot = tgtNode.inputs.findIndex(i => i.name?.toLowerCase() === query || i.type?.toLowerCase() === query);
                        }
                        if (tgtSlot === -1) tgtSlot = 0;

                        if (tgtNode.disconnectInput) {
                            tgtNode.disconnectInput(tgtSlot);
                        }
                        
                        srcNode.connect(srcSlot, tgtNode, tgtSlot);
                    } catch (err) {
                        console.error("safeConnect error:", err);
                    }
                };

                // 0. Remove ALL external nodes except this WOXCinemaStudioNode
                const allNodes = [...(app.graph._nodes || [])];
                for (const n of allNodes) {
                    if (n && n !== node && n.id !== node.id && n.type !== "WOXCinemaStudioNode" && n.title !== "WOX Cinema Studio") {
                        if (n.disconnectInput) {
                            for (let i = 0; i < (n.inputs?.length || 0); i++) n.disconnectInput(i);
                        }
                        if (n.disconnectOutput) {
                            for (let i = 0; i < (n.outputs?.length || 0); i++) n.disconnectOutput(i);
                        }
                        app.graph.remove(n);
                    }
                }

                // 1. Check if references are used in the prompt or active chips
                let usedRefs = references.filter(r => r.tag && promptInput.value.includes(r.tag));
                const activeBadges = activeRefsBar ? Array.from(activeRefsBar.querySelectorAll(".wox-active-ref-chip")) : [];
                
                if (activeBadges.length > 0) {
                    activeBadges.forEach(chip => {
                        const tag = chip.querySelector("span")?.innerText;
                        const found = references.find(r => r.tag === tag);
                        if (found && !usedRefs.includes(found)) {
                            usedRefs.push(found);
                        }
                    });
                }

                // Strictly true ONLY if actual references exist and are referenced
                const hasReferences = usedRefs.length > 0;

                // 2. Aspect Ratio mapping for ResolutionSelector
                let resAspect = "16:9 (Widescreen)";
                if (aspectRatio === "9:16") resAspect = "9:16 (Vertical)";
                else if (aspectRatio === "1:1") resAspect = "1:1 (Square)";
                else if (aspectRatio === "21:9") resAspect = "21:9 (Cinematic)";
                else if (aspectRatio === "4:3") resAspect = "4:3 (Standard)";

                // 3. Megapixels mapping
                let megapixels = 0.98; // Default 1080p (1344 x 768)
                if (resolution === "480p" || resolution === "480") megapixels = 0.4; // 480p -> 0.4 Megapixels
                else if (resolution === "720p") megapixels = 0.8; // 720p -> 0.8 Megapixels
                else if (resolution === "4k") megapixels = 1.8; // 1824 x 1024

                // 4. Compose styled prompt according to selected Film Setup
                let fullPrompt = promptInput.value || "A cinematic shot, 8k resolution, highly detailed";
                
                const filmLookMap = {
                    "General": "Film look: Cinematic 35mm practical photography, natural balanced lighting, shallow depth of field, realistic live-action film texture, premium studio grading",
                    "Cinematic 35mm": "Film look: Kodak 35mm motion picture film stock, shallow depth of field, natural organic halation, authentic celluloid texture",
                    "IMAX 70mm": "Film look: Shot on IMAX 70mm cameras, extreme sharpness, breathtaking dynamic range, majestic scale, pristine visual clarity",
                    "NOIR": "Film look: Film Noir aesthetic, deep dramatic shadows, high contrast chiaroscuro lighting, moody monochrome tone, vintage detective texture, cinematic grain",
                    "Noir Classic": "Film look: Classic 1940s Film Noir, deep Venetian blind shadows, dramatic chiaroscuro contrast, authentic monochrome celluloid texture",
                    "Action": "Film look: High-octane blockbuster action movie style, intense dynamic contrast, kinetic visual texture, subtle motion blur, anamorphic lens flare, gritty grading",
                    "Horror": "Film look: Dark horror movie aesthetic, eerie desaturated tones, deep unsettling shadows, volumetric mist, creepy suspenseful atmosphere, tense dark grading",
                    "Comedy": "Film look: Bright vibrant comedy film aesthetic, warm high-key lighting, crisp framing, vivid colors, playful cinematic atmosphere",
                    "Epic": "Film look: Grand cinematic epic scale, IMAX 70mm aesthetic, sweeping majestic lighting, rich volumetric haze, breathtaking wide scope, dramatic heroic contrast",
                    "Drama": "Film look: Intimate prestige drama cinema style, soft naturalistic lighting, subtle film grain, emotional shallow focus, realistic nuanced palette, character-focused mood",
                    "Vintage Super 8": "Film look: Vintage Super 8mm retro film stock, warm nostalgic tones, charming film grain, subtle light leaks, retro 1970s color palette",
                    "Anime Style": "Film look: High-end Makoto Shinkai anime aesthetic, lush vibrant lighting, painterly background textures, beautiful particle effects",
                    "Hyperrealistic 8k": "Film look: Hyperrealistic 8k digital cinematography, razor-sharp details, lifelike micro-textures, photorealistic rendering"
                };
                let filmDesc = filmLookMap[filmSetup] || (filmSetup !== "Auto" ? `Film setup: ${filmSetup}` : "");

                let styleAdditions = [];
                if (filmDesc) styleAdditions.push(filmDesc);
                if (camera !== "Auto") styleAdditions.push(`Camera: ${camera}, smooth gimbal movement`);
                if (colorPalette !== "Auto") styleAdditions.push(`Color grading: ${colorPalette}`);
                if (lighting !== "Auto") styleAdditions.push(`Lighting: ${lighting}`);
                if (styleAdditions.length > 0) fullPrompt += "\n\n" + styleAdditions.join(". ");

                const durVal = parseFloat(duration) || 5;
                const framesCount = durVal === 5 ? 124 : 243;
                const startX = node.pos[0] + node.size[0] + 60;
                const startY = node.pos[1];

                // 1. UNET Loader
                const unetModelName = hasReferences 
                    ? "minimax_h3_ref2va_pruned_int8_convrot.safetensors"
                    : "minimax_h3_fl2va_pruned_int8_convrot.safetensors";
                let unet = LiteGraph.createNode("UNETLoader");
                unet.pos = [startX, startY];
                if (unet.widgets && unet.widgets[0]) unet.widgets[0].value = unetModelName;
                app.graph.add(unet);

                // 2. CLIP Loader
                let clip = LiteGraph.createNode("CLIPLoader");
                clip.pos = [startX, startY + 120];
                if (clip.widgets) {
                    if (clip.widgets[0]) clip.widgets[0].value = "qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors";
                    if (clip.widgets[1]) clip.widgets[1].value = "minimax";
                }
                app.graph.add(clip);

                // 3. Video VAE Loader
                let vaeVideo = LiteGraph.createNode("VAELoader");
                vaeVideo.pos = [startX, startY + 260];
                vaeVideo.title = "Video VAE";
                if (vaeVideo.widgets && vaeVideo.widgets[0]) vaeVideo.widgets[0].value = "minimax_h3_video_vae_fp16.safetensors";
                app.graph.add(vaeVideo);

                // 4. Audio VAE Loader
                let vaeAudio = LiteGraph.createNode("VAELoader");
                vaeAudio.pos = [startX, startY + 360];
                vaeAudio.title = "Audio VAE";
                if (vaeAudio.widgets && vaeAudio.widgets[0]) vaeAudio.widgets[0].value = "minimax_h3_audio_vae_fp32.safetensors";
                app.graph.add(vaeAudio);

                // 5. ResolutionSelector
                let resNode = LiteGraph.createNode("ResolutionSelector");
                resNode.pos = [startX + 480, startY + 360];
                if (resNode.widgets) {
                    const aspectW = resNode.widgets.find(w => w.name === "aspect_ratio") || resNode.widgets[0];
                    if (aspectW) aspectW.value = resAspect;
                    const megaW = resNode.widgets.find(w => w.name === "megapixels") || resNode.widgets[1];
                    if (megaW) megaW.value = megapixels;
                    const multW = resNode.widgets.find(w => w.name === "multiple") || resNode.widgets[2];
                    if (multW) multW.value = 32;
                }
                app.graph.add(resNode);

                // 6. MiniMax Core Node (Reference or ImageToVideo)
                let mmNode = null;
                if (hasReferences) {
                    let refPrompt = promptInput.value || "A cinematic shot, 8k resolution, highly detailed";
                    usedRefs.forEach((ref, rIdx) => {
                        const picTag = `<Picture ${rIdx + 1}>`;
                        refPrompt = refPrompt.split(ref.tag).join(picTag);
                    });

                    mmNode = LiteGraph.createNode("MiniMaxH3ReferenceToVideo");
                    mmNode.pos = [startX + 480, startY];
                    if (mmNode.widgets) {
                        const pw = mmNode.widgets.find(w => w.name === "prompt") || mmNode.widgets[0];
                        if (pw) {
                            pw.value = refPrompt;
                            if (pw.callback) pw.callback(refPrompt);
                        }
                        const lw = mmNode.widgets.find(w => w.name === "length");
                        if (lw) lw.value = framesCount;
                        const sizeW = mmNode.widgets.find(w => w.name === "ref_image_size");
                        if (sizeW) sizeW.value = "match";
                    }
                    app.graph.add(mmNode);

                    // Connect Reference LoadImage nodes
                    usedRefs.forEach((ref, rIdx) => {
                        let loadImg = LiteGraph.createNode("LoadImage");
                        loadImg.pos = [startX + 480, startY + 540 + (rIdx * 320)];
                        loadImg.title = `<Picture ${rIdx + 1}>`;
                        if (loadImg.widgets && loadImg.widgets[0]) {
                            loadImg.widgets[0].value = ref.filename;
                        }
                        app.graph.add(loadImg);
                        
                        let refSlot = mmNode.findInputSlot ? mmNode.findInputSlot(`ref_image_${rIdx}`) : (3 + rIdx);
                        if (refSlot === -1) refSlot = 3 + rIdx;
                        safeConnect(loadImg, "IMAGE", mmNode, refSlot);
                    });

                    // Inputs for ReferenceToVideo: 0=clip, 1=vae, 2=audio_vae
                    safeConnect(clip, "CLIP", mmNode, "clip");
                    safeConnect(vaeVideo, "VAE", mmNode, "vae");
                    safeConnect(vaeAudio, "VAE", mmNode, "audio_vae");

                    let wSlot = mmNode.findInputSlot ? mmNode.findInputSlot("width") : -1;
                    let hSlot = mmNode.findInputSlot ? mmNode.findInputSlot("height") : -1;
                    if (wSlot !== -1) safeConnect(resNode, "width", mmNode, wSlot);
                    if (hSlot !== -1) safeConnect(resNode, "height", mmNode, hSlot);
                } else {
                    mmNode = LiteGraph.createNode("MiniMaxH3ImageToVideo");
                    mmNode.pos = [startX + 480, startY];
                    if (mmNode.widgets) {
                        const pw = mmNode.widgets.find(w => w.name === "prompt") || mmNode.widgets[0];
                        if (pw) {
                            pw.value = promptInput.value || "A cinematic shot, 8k resolution, highly detailed";
                            if (pw.callback) pw.callback(pw.value);
                        }
                        const lw = mmNode.widgets.find(w => w.name === "length");
                        if (lw) lw.value = framesCount;
                    }
                    app.graph.add(mmNode);

                    // Inputs for MiniMaxH3ImageToVideo: clip, vae, width, height, first_frame, last_frame
                    safeConnect(clip, "CLIP", mmNode, "clip");
                    safeConnect(vaeVideo, "VAE", mmNode, "vae");

                    let wSlot = mmNode.findInputSlot ? mmNode.findInputSlot("width") : -1;
                    let hSlot = mmNode.findInputSlot ? mmNode.findInputSlot("height") : -1;
                    if (wSlot !== -1) safeConnect(resNode, "width", mmNode, wSlot);
                    if (hSlot !== -1) safeConnect(resNode, "height", mmNode, hSlot);

                    // Connect First Frame if selected
                    if (firstFrameRef) {
                        let loadImgFirst = LiteGraph.createNode("LoadImage");
                        loadImgFirst.pos = [startX + 480, startY + 450];
                        loadImgFirst.title = `<First Frame: ${firstFrameRef.tag}>`;
                        if (loadImgFirst.widgets && loadImgFirst.widgets[0]) {
                            loadImgFirst.widgets[0].value = firstFrameRef.filename;
                        }
                        app.graph.add(loadImgFirst);
                        safeConnect(loadImgFirst, "IMAGE", mmNode, "first_frame");
                    }

                    // Connect Final Frame if selected
                    if (lastFrameRef) {
                        let loadImgLast = LiteGraph.createNode("LoadImage");
                        loadImgLast.pos = [startX + 480, startY + (firstFrameRef ? 770 : 450)];
                        loadImgLast.title = `<Final Frame: ${lastFrameRef.tag}>`;
                        if (loadImgLast.widgets && loadImgLast.widgets[0]) {
                            loadImgLast.widgets[0].value = lastFrameRef.filename;
                        }
                        app.graph.add(loadImgLast);
                        safeConnect(loadImgLast, "IMAGE", mmNode, "last_frame");
                    }
                }

                // 7. Basic Guider
                let guider = LiteGraph.createNode("BasicGuider");
                guider.pos = [startX + 980, startY];
                app.graph.add(guider);

                // 8. KSamplerSelect
                let sampler = LiteGraph.createNode("KSamplerSelect");
                sampler.pos = [startX + 980, startY + 90];
                if (sampler.widgets && sampler.widgets[0]) sampler.widgets[0].value = "res_multistep";
                app.graph.add(sampler);

                // 9. Basic Scheduler
                let scheduler = LiteGraph.createNode("BasicScheduler");
                scheduler.pos = [startX + 980, startY + 180];
                if (scheduler.widgets) {
                    if (scheduler.widgets[0]) scheduler.widgets[0].value = "simple";
                    if (scheduler.widgets[1]) scheduler.widgets[1].value = 20;
                }
                app.graph.add(scheduler);

                // Connect UNET -> Guider & Scheduler
                safeConnect(unet, "MODEL", guider, "model");
                safeConnect(unet, "MODEL", scheduler, "model");

                // Connect Core Node POSITIVE -> BasicGuider (conditioning)
                safeConnect(mmNode, "positive", guider, "conditioning");

                // 10. Random Noise
                let noise = LiteGraph.createNode("RandomNoise");
                noise.pos = [startX + 980, startY + 340];
                app.graph.add(noise);

                // 11. SamplerCustomAdvanced
                let samplerAdv = LiteGraph.createNode("SamplerCustomAdvanced");
                samplerAdv.pos = [startX + 1320, startY];
                app.graph.add(samplerAdv);

                // Wire SamplerCustomAdvanced
                safeConnect(noise, "NOISE", samplerAdv, "noise");
                safeConnect(guider, "GUIDER", samplerAdv, "guider");
                safeConnect(sampler, "SAMPLER", samplerAdv, "sampler");
                safeConnect(scheduler, "SIGMAS", samplerAdv, "sigmas");
                safeConnect(mmNode, "LATENT", samplerAdv, "latent_image");

                // 12. VAEDecode (Video)
                let vDecode = LiteGraph.createNode("VAEDecode");
                vDecode.pos = [startX + 1680, startY];
                app.graph.add(vDecode);
                safeConnect(samplerAdv, 0, vDecode, "samples");
                safeConnect(vaeVideo, "VAE", vDecode, "vae");

                // 13. VAEDecodeAudio (Audio)
                let aDecode = LiteGraph.createNode("VAEDecodeAudio");
                aDecode.pos = [startX + 1680, startY + 120];
                app.graph.add(aDecode);
                safeConnect(samplerAdv, 0, aDecode, "samples");
                safeConnect(vaeAudio, "VAE", aDecode, "vae");

                // 14. CreateVideo
                let createVid = LiteGraph.createNode("CreateVideo");
                createVid.pos = [startX + 1980, startY];
                if (createVid.widgets) {
                    if (createVid.widgets[0]) createVid.widgets[0].value = 24;
                    if (createVid.widgets[1]) createVid.widgets[1].value = 8;
                }
                app.graph.add(createVid);
                safeConnect(vDecode, "IMAGE", createVid, "images");
                safeConnect(aDecode, "AUDIO", createVid, "audio");

                // 15. SaveVideo
                let saveVid = LiteGraph.createNode("SaveVideo");
                saveVid.pos = [startX + 2300, startY];
                if (saveVid.widgets && saveVid.widgets[0]) saveVid.widgets[0].value = "video/MiniMax_H3";
                app.graph.add(saveVid);

                // Connect CreateVideo (VIDEO) -> SaveVideo (video)
                safeConnect(createVid, "VIDEO", saveVid, "video");

                if (app.graph.change) app.graph.change();
                if (app.graph.setDirtyCanvas) app.graph.setDirtyCanvas(true, true);
                if (app.canvas && app.canvas.draw) app.canvas.draw(true, true);
            };

            // Helper to build/sync Z-Image Turbo (Image Mode) Pipeline
            const syncOrBuildZImageTurboPipeline = () => {
                if (!app || !app.graph) return;

                // Safe connection helper
                const safeConnect = (srcNode, srcNameOrIdx, tgtNode, tgtNameOrIdx) => {
                    if (!srcNode || !tgtNode) return;
                    try {
                        let srcSlot = -1;
                        if (typeof srcNameOrIdx === "number") {
                            srcSlot = srcNameOrIdx;
                        } else if (srcNode.findOutputSlot) {
                            srcSlot = srcNode.findOutputSlot(srcNameOrIdx);
                        }
                        if (srcSlot === -1 && srcNode.outputs) {
                            const query = String(srcNameOrIdx).toLowerCase();
                            srcSlot = srcNode.outputs.findIndex(o => o.name?.toLowerCase() === query || o.type?.toLowerCase() === query);
                        }
                        if (srcSlot === -1) srcSlot = 0;

                        let tgtSlot = -1;
                        if (typeof tgtNameOrIdx === "number") {
                            tgtSlot = tgtNameOrIdx;
                        } else if (tgtNode.findInputSlot) {
                            tgtSlot = tgtNode.findInputSlot(tgtNameOrIdx);
                        }
                        if (tgtSlot === -1 && tgtNode.inputs) {
                            const query = String(tgtNameOrIdx).toLowerCase();
                            tgtSlot = tgtNode.inputs.findIndex(i => i.name?.toLowerCase() === query || i.type?.toLowerCase() === query);
                        }
                        if (tgtSlot === -1) tgtSlot = 0;

                        if (tgtNode.disconnectInput) {
                            tgtNode.disconnectInput(tgtSlot);
                        }
                        
                        srcNode.connect(srcSlot, tgtNode, tgtSlot);
                    } catch (err) {
                        console.error("safeConnect error:", err);
                    }
                };

                // 0. Remove ALL external nodes except this WOXCinemaStudioNode
                const allNodes = [...(app.graph._nodes || [])];
                for (const n of allNodes) {
                    if (n && n !== node && n.id !== node.id && n.type !== "WOXCinemaStudioNode" && n.title !== "WOX Cinema Studio") {
                        if (n.disconnectInput) {
                            for (let i = 0; i < (n.inputs?.length || 0); i++) n.disconnectInput(i);
                        }
                        if (n.disconnectOutput) {
                            for (let i = 0; i < (n.outputs?.length || 0); i++) n.disconnectOutput(i);
                        }
                        app.graph.remove(n);
                    }
                }

                const startX = node.pos[0] + node.size[0] + 60;
                const startY = node.pos[1];

                // 1. Aspect ratio mapping for ResolutionSelector
                let resAspect = "1:1 (Square)";
                if (aspectRatio === "16:9") resAspect = "16:9 (Widescreen)";
                else if (aspectRatio === "9:16") resAspect = "9:16 (Vertical)";
                else if (aspectRatio === "21:9") resAspect = "21:9 (Cinematic)";
                else if (aspectRatio === "4:3") resAspect = "4:3 (Standard)";

                // 2. Resolution Selector
                let resNode = LiteGraph.createNode("ResolutionSelector");
                resNode.pos = [startX, startY + 450];
                if (resNode.widgets) {
                    const aspectW = resNode.widgets.find(w => w.name === "aspect_ratio") || resNode.widgets[0];
                    if (aspectW) aspectW.value = resAspect;
                    let zMegapixels = 0.98;
                    if (resolution === "480p" || resolution === "480") zMegapixels = 0.4;
                    else if (resolution === "720p") zMegapixels = 0.8;
                    else if (resolution === "4k") zMegapixels = 1.8;
                    const megaW = resNode.widgets.find(w => w.name === "megapixels") || resNode.widgets[1];
                    if (megaW) megaW.value = zMegapixels;
                    const multW = resNode.widgets.find(w => w.name === "multiple") || resNode.widgets[2];
                    if (multW) multW.value = 8;
                }
                app.graph.add(resNode);

                // 3. UNET Loader (Z-Image Turbo)
                let unet = LiteGraph.createNode("UNETLoader");
                unet.pos = [startX, startY];
                if (unet.widgets && unet.widgets[0]) {
                    const availableUnet = unet.widgets[0].options?.values || [];
                    if (availableUnet.includes("z_image_turbo_int8_convrot.safetensors")) {
                        unet.widgets[0].value = "z_image_turbo_int8_convrot.safetensors";
                    } else if (availableUnet.includes("z-image-turbo-fp8-e4m3fn.safetensors")) {
                        unet.widgets[0].value = "z-image-turbo-fp8-e4m3fn.safetensors";
                    } else {
                        const match = availableUnet.find(v => v.toLowerCase().includes("z_image_turbo_int8_convrot") || v.toLowerCase().includes("convrot") || v.toLowerCase().includes("z-image") || v.toLowerCase().includes("z_image"));
                        unet.widgets[0].value = match || "z_image_turbo_int8_convrot.safetensors";
                    }
                }
                app.graph.add(unet);

                // 3.1 ModelSamplingAuraFlow (shift: 3.0)
                let auraFlow = LiteGraph.createNode("ModelSamplingAuraFlow");
                if (auraFlow) {
                    auraFlow.pos = [startX + 300, startY];
                    if (auraFlow.widgets && auraFlow.widgets[0]) {
                        auraFlow.widgets[0].value = 3.0;
                    }
                    app.graph.add(auraFlow);
                    safeConnect(unet, "MODEL", auraFlow, "model");
                }

                // 4. CLIP Loader (Qwen 3 4B / Lumina 2)
                let clip = LiteGraph.createNode("CLIPLoader");
                clip.pos = [startX, startY + 150];
                if (clip.widgets) {
                    const availableClip = clip.widgets[0]?.options?.values || [];
                    if (availableClip.includes("qwen_3_4b.safetensors")) {
                        clip.widgets[0].value = "qwen_3_4b.safetensors";
                    } else if (availableClip.includes("qwen_3_4b_fp8_mixed.safetensors")) {
                        clip.widgets[0].value = "qwen_3_4b_fp8_mixed.safetensors";
                    } else {
                        const match = availableClip.find(v => v.toLowerCase().includes("qwen_3_4b"));
                        clip.widgets[0].value = match || "qwen_3_4b.safetensors";
                    }
                    if (clip.widgets[1]) clip.widgets[1].value = "lumina2";
                }
                app.graph.add(clip);

                // 5. VAE Loader (ae.safetensors)
                let vae = LiteGraph.createNode("VAELoader");
                vae.pos = [startX, startY + 300];
                if (vae.widgets && vae.widgets[0]) {
                    vae.widgets[0].value = "ae.safetensors";
                }
                app.graph.add(vae);

                // 6. EmptySD3LatentImage (16-channel latent for Z-Image)
                let emptyLatent = LiteGraph.createNode("EmptySD3LatentImage");
                if (!emptyLatent) {
                    emptyLatent = LiteGraph.createNode("EmptyLatentImage");
                }
                emptyLatent.pos = [startX + 580, startY + 450];
                if (emptyLatent.widgets) {
                    const bw = emptyLatent.widgets.find(w => w.name === "batch_size");
                    if (bw) bw.value = variations || 1;
                }
                app.graph.add(emptyLatent);
                safeConnect(resNode, "width", emptyLatent, "width");
                safeConnect(resNode, "height", emptyLatent, "height");

                // 7. Positive Prompt (CLIPTextEncode)
                let posText = LiteGraph.createNode("CLIPTextEncode");
                posText.pos = [startX + 580, startY];
                posText.size = [420, 200];
                posText.title = "Positive Prompt";
                if (posText.widgets && posText.widgets[0]) {
                    posText.widgets[0].value = promptInput.value || "A cinematic photo, highly detailed, 8k";
                }
                app.graph.add(posText);
                safeConnect(clip, "CLIP", posText, "clip");

                // 8. ConditioningZeroOut (Negative Prompt)
                let zeroOut = LiteGraph.createNode("ConditioningZeroOut");
                if (zeroOut) {
                    zeroOut.pos = [startX + 580, startY + 230];
                    app.graph.add(zeroOut);
                    safeConnect(posText, "CONDITIONING", zeroOut, "conditioning");
                }

                // 9. KSampler (Z-Image Turbo: 8 steps, cfg 1.0, res_multistep, simple)
                let ksampler = LiteGraph.createNode("KSampler");
                ksampler.pos = [startX + 1040, startY];
                if (ksampler.widgets) {
                    const seedW = ksampler.widgets.find(w => w.name === "seed") || ksampler.widgets[0];
                    if (seedW) seedW.value = Math.floor(Math.random() * 1000000000000000);
                    const stepsW = ksampler.widgets.find(w => w.name === "steps") || ksampler.widgets[2];
                    if (stepsW) stepsW.value = 8;
                    const cfgW = ksampler.widgets.find(w => w.name === "cfg") || ksampler.widgets[3];
                    if (cfgW) cfgW.value = 1.0;
                    const samplerW = ksampler.widgets.find(w => w.name === "sampler_name") || ksampler.widgets[4];
                    if (samplerW) samplerW.value = "res_multistep";
                    const schedW = ksampler.widgets.find(w => w.name === "scheduler") || ksampler.widgets[5];
                    if (schedW) schedW.value = "simple";
                    const denoiseW = ksampler.widgets.find(w => w.name === "denoise") || ksampler.widgets[6];
                    if (denoiseW) denoiseW.value = 1.0;
                }
                app.graph.add(ksampler);
                const samplerModelSource = auraFlow || unet;
                safeConnect(samplerModelSource, "MODEL", ksampler, "model");
                safeConnect(posText, "CONDITIONING", ksampler, "positive");
                if (zeroOut) {
                    safeConnect(zeroOut, "CONDITIONING", ksampler, "negative");
                } else {
                    safeConnect(posText, "CONDITIONING", ksampler, "negative");
                }
                safeConnect(emptyLatent, "LATENT", ksampler, "latent_image");

                // 10. VAEDecode
                let vaeDecode = LiteGraph.createNode("VAEDecode");
                vaeDecode.pos = [startX + 1400, startY];
                app.graph.add(vaeDecode);
                safeConnect(ksampler, "LATENT", vaeDecode, "samples");
                safeConnect(vae, "VAE", vaeDecode, "vae");

                // 11. SaveImage
                let saveImage = LiteGraph.createNode("SaveImage");
                saveImage.pos = [startX + 1660, startY];
                saveImage.size = [420, 500];
                if (saveImage.widgets && saveImage.widgets[0]) {
                    saveImage.widgets[0].value = "Z_Image_Turbo";
                }
                app.graph.add(saveImage);
                safeConnect(vaeDecode, "IMAGE", saveImage, "images");

                if (app.graph.change) app.graph.change();
                if (app.graph.setDirtyCanvas) app.graph.setDirtyCanvas(true, true);
                if (app.canvas && app.canvas.draw) app.canvas.draw(true, true);
            };

            const syncOrBuildKrea2Pipeline = syncOrBuildZImageTurboPipeline;

            syncOrBuildQwenImageEditPipeline = (inputFilename, promptText) => {
                if (!app || !app.graph) return;

                // Safe connection helper
                const safeConnect = (srcNode, srcNameOrIdx, tgtNode, tgtNameOrIdx) => {
                    if (!srcNode || !tgtNode) return;
                    try {
                        let srcSlot = -1;
                        if (typeof srcNameOrIdx === "number") {
                            srcSlot = srcNameOrIdx;
                        } else if (srcNode.findOutputSlot) {
                            srcSlot = srcNode.findOutputSlot(srcNameOrIdx);
                        }
                        if (srcSlot === -1 && srcNode.outputs) {
                            const query = String(srcNameOrIdx).toLowerCase();
                            srcSlot = srcNode.outputs.findIndex(o => o.name?.toLowerCase() === query || o.type?.toLowerCase() === query);
                        }
                        if (srcSlot === -1) srcSlot = 0;

                        let tgtSlot = -1;
                        if (typeof tgtNameOrIdx === "number") {
                            tgtSlot = tgtNameOrIdx;
                        } else if (tgtNode.findInputSlot) {
                            tgtSlot = tgtNode.findInputSlot(tgtNameOrIdx);
                        }
                        if (tgtSlot === -1 && tgtNode.inputs) {
                            const query = String(tgtNameOrIdx).toLowerCase();
                            tgtSlot = tgtNode.inputs.findIndex(i => i.name?.toLowerCase() === query || i.type?.toLowerCase() === query);
                        }
                        if (tgtSlot === -1) tgtSlot = 0;

                        if (tgtNode.disconnectInput) {
                            tgtNode.disconnectInput(tgtSlot);
                        }
                        
                        srcNode.connect(srcSlot, tgtNode, tgtSlot);
                    } catch (err) {
                        console.error("safeConnect error:", err);
                    }
                };

                // 0. Remove ALL external nodes except this WOXCinemaStudioNode
                const allNodes = [...(app.graph._nodes || [])];
                for (const n of allNodes) {
                    if (n && n !== node && n.id !== node.id && n.type !== "WOXCinemaStudioNode" && n.title !== "WOX Cinema Studio") {
                        if (n.disconnectInput) {
                            for (let i = 0; i < (n.inputs?.length || 0); i++) n.disconnectInput(i);
                        }
                        if (n.disconnectOutput) {
                            for (let i = 0; i < (n.outputs?.length || 0); i++) n.disconnectOutput(i);
                        }
                        app.graph.remove(n);
                    }
                }

                const startX = node.pos[0] + node.size[0] + 60;
                const startY = node.pos[1];

                // 1. LoadImage (loads the target image from input)
                let loadImg = LiteGraph.createNode("LoadImage");
                loadImg.pos = [startX, startY];
                if (loadImg.widgets && loadImg.widgets[0]) {
                    loadImg.widgets[0].value = inputFilename;
                }
                app.graph.add(loadImg);

                // 2. ImageScaleToTotalPixels (lanczos, 1.5 megapixels)
                let scaleNode = LiteGraph.createNode("ImageScaleToTotalPixels");
                let imageSource = loadImg;
                if (scaleNode) {
                    scaleNode.pos = [startX + 300, startY];
                    if (scaleNode.widgets) {
                        const mMethod = scaleNode.widgets.find(w => w.name === "upscale_method") || scaleNode.widgets[0];
                        if (mMethod) mMethod.value = "lanczos";
                        const mMega = scaleNode.widgets.find(w => w.name === "megapixels") || scaleNode.widgets[1];
                        if (mMega) mMega.value = 1.5;
                        const mSteps = scaleNode.widgets.find(w => w.name === "resolution_steps") || scaleNode.widgets[2];
                        if (mSteps) mSteps.value = 1;
                    }
                    app.graph.add(scaleNode);
                    safeConnect(loadImg, "IMAGE", scaleNode, "image");
                    imageSource = scaleNode;
                }

                // 3. UNET Loader (qwen_image_edit_fp8_e4m3fn.safetensors)
                let unet = LiteGraph.createNode("UNETLoader");
                unet.pos = [startX, startY + 360];
                if (unet.widgets) {
                    const unetW = unet.widgets.find(w => w.name === "unet_name") || unet.widgets[0];
                    const dtypeW = unet.widgets.find(w => w.name === "weight_dtype") || unet.widgets[1];
                    const availableUnet = unetW?.options?.values || [];
                    const targetUnet = "qwen_image_edit_fp8_e4m3fn.safetensors";
                    if (availableUnet.includes(targetUnet)) {
                        unetW.value = targetUnet;
                    } else {
                        const match = availableUnet.find(v => v.toLowerCase().includes("qwen_image_edit"));
                        unetW.value = match || targetUnet;
                    }
                    if (dtypeW) dtypeW.value = "default";
                }
                app.graph.add(unet);

                // 4. LoraLoaderModelOnly (Qwen-Image-Edit-Lightning-4steps-V1.0-bf16.safetensors)
                let lora = LiteGraph.createNode("LoraLoaderModelOnly");
                let modelSource = unet;
                if (lora) {
                    lora.pos = [startX + 320, startY + 360];
                    if (lora.widgets) {
                        const loraW = lora.widgets.find(w => w.name === "lora_name") || lora.widgets[0];
                        const availableLoras = loraW?.options?.values || [];
                        const targetLora = "Qwen-Image-Edit-Lightning-4steps-V1.0-bf16.safetensors";
                        if (availableLoras.includes(targetLora)) {
                            loraW.value = targetLora;
                        } else {
                            const match = availableLoras.find(v => v.toLowerCase().includes("qwen-image-edit-lightning") || v.toLowerCase().includes("lightning-4steps"));
                            loraW.value = match || targetLora;
                        }
                        const strengthW = lora.widgets.find(w => w.name === "strength_model") || lora.widgets[1];
                        if (strengthW) strengthW.value = 1.0;
                    }
                    app.graph.add(lora);
                    safeConnect(unet, 0, lora, 0);
                    modelSource = lora;
                }

                // 5. ModelSamplingAuraFlow (shift: 3.0)
                let auraFlow = LiteGraph.createNode("ModelSamplingAuraFlow");
                if (auraFlow) {
                    auraFlow.pos = [startX + 640, startY + 360];
                    if (auraFlow.widgets && auraFlow.widgets[0]) {
                        auraFlow.widgets[0].value = 3.0;
                    }
                    app.graph.add(auraFlow);
                    safeConnect(modelSource, 0, auraFlow, 0);
                    modelSource = auraFlow;
                }

                // 6. CFGNorm (strength: 1.0, pre_cfg: false)
                let cfgNorm = LiteGraph.createNode("CFGNorm");
                if (cfgNorm) {
                    cfgNorm.pos = [startX + 940, startY + 360];
                    if (cfgNorm.widgets) {
                        const strW = cfgNorm.widgets.find(w => w.name === "strength") || cfgNorm.widgets[0];
                        if (strW) strW.value = 1.0;
                        const preW = cfgNorm.widgets.find(w => w.name === "pre_cfg") || cfgNorm.widgets[1];
                        if (preW) preW.value = false;
                    }
                    app.graph.add(cfgNorm);
                    safeConnect(modelSource, 0, cfgNorm, 0);
                    modelSource = cfgNorm;
                }

                // 7. CLIPLoader (qwen_2.5_vl_7b_fp8_scaled.safetensors, type: qwen_image)
                let clip = LiteGraph.createNode("CLIPLoader");
                clip.pos = [startX, startY + 540];
                if (clip.widgets) {
                    const clipW = clip.widgets.find(w => w.name === "clip_name") || clip.widgets[0];
                    const typeW = clip.widgets.find(w => w.name === "type") || clip.widgets[1];
                    const devW = clip.widgets.find(w => w.name === "device") || clip.widgets[2];
                    const availableClip = clipW?.options?.values || [];
                    const targetClip = "qwen_2.5_vl_7b_fp8_scaled.safetensors";
                    if (availableClip.includes(targetClip)) {
                        clipW.value = targetClip;
                    } else {
                        const match = availableClip.find(v => v.toLowerCase().includes("qwen_2.5_vl_7b") || v.toLowerCase().includes("2.5_vl_7b"));
                        clipW.value = match || targetClip;
                    }
                    if (typeW) typeW.value = "qwen_image";
                    if (devW) devW.value = "default";
                }
                app.graph.add(clip);

                // 8. VAELoader (qwen_image_vae.safetensors)
                let vae = LiteGraph.createNode("VAELoader");
                vae.pos = [startX, startY + 680];
                if (vae.widgets) {
                    const vaeW = vae.widgets.find(w => w.name === "vae_name") || vae.widgets[0];
                    const availableVae = vaeW?.options?.values || [];
                    const targetVae = "qwen_image_vae.safetensors";
                    if (availableVae.includes(targetVae)) {
                        vaeW.value = targetVae;
                    } else {
                        const match = availableVae.find(v => v.toLowerCase().includes("qwen_image_vae"));
                        vaeW.value = match || targetVae;
                    }
                }
                app.graph.add(vae);

                // 9. VAEEncode
                let vaeEncode = LiteGraph.createNode("VAEEncode");
                vaeEncode.pos = [startX + 600, startY];
                app.graph.add(vaeEncode);
                safeConnect(imageSource, 0, vaeEncode, 0);
                safeConnect(vae, 0, vaeEncode, 1);

                // 10. Positive TextEncodeQwenImageEdit
                let posEncode = LiteGraph.createNode("TextEncodeQwenImageEdit");
                posEncode.pos = [startX + 600, startY + 120];
                posEncode.size = [420, 180];
                posEncode.title = "Positive Edit Prompt";
                if (posEncode.widgets && posEncode.widgets[0]) {
                    posEncode.widgets[0].value = promptText || "Make the character smile and look joyful";
                }
                app.graph.add(posEncode);
                safeConnect(clip, 0, posEncode, 0);
                safeConnect(vae, 0, posEncode, 1);
                safeConnect(imageSource, 0, posEncode, 2);

                // 11. Negative TextEncodeQwenImageEdit
                let negEncode = LiteGraph.createNode("TextEncodeQwenImageEdit");
                negEncode.pos = [startX + 600, startY + 340];
                negEncode.size = [420, 120];
                negEncode.title = "Negative Edit Prompt";
                if (negEncode.widgets && negEncode.widgets[0]) {
                    negEncode.widgets[0].value = "";
                }
                app.graph.add(negEncode);
                safeConnect(clip, 0, negEncode, 0);
                safeConnect(vae, 0, negEncode, 1);
                safeConnect(imageSource, 0, negEncode, 2);

                // 12. KSampler (Lightning 4 steps, cfg 1.0, euler, simple)
                let ksampler = LiteGraph.createNode("KSampler");
                ksampler.pos = [startX + 1080, startY];
                if (ksampler.widgets) {
                    const seedW = ksampler.widgets.find(w => w.name === "seed") || ksampler.widgets[0];
                    if (seedW) seedW.value = Math.floor(Math.random() * 1000000000000000);
                    const stepsW = ksampler.widgets.find(w => w.name === "steps") || ksampler.widgets[2];
                    if (stepsW) stepsW.value = 4;
                    const cfgW = ksampler.widgets.find(w => w.name === "cfg") || ksampler.widgets[3];
                    if (cfgW) cfgW.value = 1.0;
                    const samplerW = ksampler.widgets.find(w => w.name === "sampler_name") || ksampler.widgets[4];
                    if (samplerW) samplerW.value = "euler";
                    const schedW = ksampler.widgets.find(w => w.name === "scheduler") || ksampler.widgets[5];
                    if (schedW) schedW.value = "simple";
                    const denoiseW = ksampler.widgets.find(w => w.name === "denoise") || ksampler.widgets[6];
                    if (denoiseW) denoiseW.value = 1.0;
                }
                app.graph.add(ksampler);
                safeConnect(modelSource, 0, ksampler, 0);
                safeConnect(posEncode, 0, ksampler, 1);
                safeConnect(negEncode, 0, ksampler, 2);
                safeConnect(vaeEncode, 0, ksampler, 3);

                // 13. VAEDecode
                let vaeDecode = LiteGraph.createNode("VAEDecode");
                vaeDecode.pos = [startX + 1440, startY];
                app.graph.add(vaeDecode);
                safeConnect(ksampler, 0, vaeDecode, 0);
                safeConnect(vae, 0, vaeDecode, 1);

                // 14. SaveImage
                let saveImage = LiteGraph.createNode("SaveImage");
                saveImage.pos = [startX + 1700, startY];
                saveImage.size = [420, 500];
                if (saveImage.widgets && saveImage.widgets[0]) {
                    saveImage.widgets[0].value = "wox_cinema_edit";
                }
                app.graph.add(saveImage);
                safeConnect(vaeDecode, 0, saveImage, 0);

                if (app.graph.change) app.graph.change();
                if (app.graph.setDirtyCanvas) app.graph.setDirtyCanvas(true, true);
                if (app.canvas && app.canvas.draw) app.canvas.draw(true, true);
            };

            // Ultra-fast Native Cinematic Prompt Translator & Enhancer (Level 2 - Zero Latency)
            const smartTranslateAndEnhance = (text, setup, cam, col, light) => {
                if (!text || !text.trim()) return text;
                
                const dict = [
                    // Characters & Subjects
                    [/\bun uomo\b/gi, "a man"],
                    [/\buna donna\b/gi, "a woman"],
                    [/\bun ragazzo\b/gi, "a young man"],
                    [/\buna ragazza\b/gi, "a young woman"],
                    [/\bun bambino\b/gi, "a young boy"],
                    [/\buna bambina\b/gi, "a young girl"],
                    [/\bun guerriero\b/gi, "a battle-hardened warrior"],
                    [/\bun soldato\b/gi, "a tactical soldier"],
                    [/\bun detective\b/gi, "a brooding detective"],
                    [/\bun anziano\b/gi, "an elderly man"],
                    [/\buna anziana\b/gi, "an elderly woman"],
                    [/\bun cyborg\b/gi, "a cybernetic android"],
                    [/\bun robot\b/gi, "a futuristic robot"],
                    [/\bun pilota\b/gi, "a focused pilot"],
                    
                    // Actions & Verbs
                    [/\bsi alza e beve un bicchiere d'acqua\b/gi, "stands up gracefully, picks up a clear glass and drinks water"],
                    [/\bsi alza e beve\b/gi, "stands up and takes a slow drink"],
                    [/\bsi alza\b/gi, "standing up smoothly"],
                    [/\bbeve un bicchiere d'acqua\b/gi, "drinking a refreshing glass of water"],
                    [/\bbeve un bicchiere di vino\b/gi, "sipping from a glass of red wine"],
                    [/\bbeve\b/gi, "taking a drink"],
                    [/\bcammina lentamente\b/gi, "walking forward with slow deliberate steps"],
                    [/\bcammina\b/gi, "walking forward"],
                    [/\bcorre veloce\b/gi, "sprinting with intense urgency"],
                    [/\bcorre\b/gi, "running urgently through the frame"],
                    [/\bsalta da un palazzo\b/gi, "leaping dramatically across rooftop ledges"],
                    [/\bsalta\b/gi, "leaping across the space"],
                    [/\bguarda verso la camera\b/gi, "making direct eye contact with the camera"],
                    [/\bguarda verso l'orizzonte\b/gi, "gazing toward the vast horizon"],
                    [/\bguarda in alto\b/gi, "looking upward with awe"],
                    [/\bguarda\b/gi, "looking intensely"],
                    [/\bosserva con attenzione\b/gi, "observing intently with sharp focus"],
                    [/\bosserva\b/gi, "observing"],
                    [/\bsi volta\b/gi, "turning around abruptly"],
                    [/\bsi gira\b/gi, "turning around"],
                    [/\bcombatte\b/gi, "engaging in dynamic hand-to-hand combat"],
                    [/\blotta\b/gi, "fighting fiercely"],
                    [/\bsfonda\b/gi, "crashing forcefully through"],
                    [/\bsi ferma\b/gi, "stopping abruptly, catching breath"],
                    [/\brespirando affannosamente\b/gi, "breathing heavily with visible chest movement"],
                    [/\bparla\b/gi, "speaking passionately"],
                    [/\bsorride\b/gi, "smiling softly with emotional warmth"],
                    [/\bpiange\b/gi, "crying with dramatic tears glistening on face"],
                    [/\burla\b/gi, "screaming with raw intensity"],
                    [/\bsussurra\b/gi, "whispering in close-up"],
                    [/\bguida\b/gi, "driving aggressively at high speed"],

                    // Locations & Environments
                    [/\bsul tetto di un grattacielo\b/gi, "on the wet ledge of a towering modern skyscraper"],
                    [/\bsul tetto\b/gi, "on the expansive rooftop"],
                    [/\bdi un grattacielo\b/gi, "of a massive skyscraper"],
                    [/\bin una stanza buia\b/gi, "inside a dark moody cinematic room"],
                    [/\bin una stanza\b/gi, "inside a beautifully styled cinematic room"],
                    [/\bin un vicolo\b/gi, "in a narrow shadowy urban alleyway"],
                    [/\bper strada\b/gi, "along the bustling city street"],
                    [/\bin una città futuristica\b/gi, "inside a sprawling futuristic metropolis"],
                    [/\bin una città\b/gi, "in a grand metropolis"],
                    [/\bnel deserto\b/gi, "across the vast arid desert dunes"],
                    [/\bnel bosco\b/gi, "deep within a misty ancient woodland"],
                    [/\bnella foresta\b/gi, "in an overgrown atmospheric forest"],
                    [/\bin riva al mare\b/gi, "on the coastline with crashing ocean waves"],
                    [/\bsulla spiaggia\b/gi, "along the sandy shore at golden hour"],
                    [/\bin montagna\b/gi, "amidst rugged alpine mountain peaks"],
                    [/\bin un bar\b/gi, "inside a dimly lit vintage jazz bar"],
                    [/\bin un laboratorio\b/gi, "inside a high-tech sci-fi research lab"],
                    [/\bin ospedale\b/gi, "in a clinical sterile hospital corridor"],

                    // Atmosphere & Weather
                    [/\bdi notte sotto la pioggia\b/gi, "at night under heavy pouring rain with wet reflective pavement"],
                    [/\bdi notte\b/gi, "at night with moody shadow play"],
                    [/\bsotto la pioggia battente\b/gi, "under torrential downpour, water splashing dynamically"],
                    [/\bsotto la pioggia\b/gi, "under falling rain, wet textures"],
                    [/\bnella nebbia fitta\b/gi, "shrouded in dense volumetric fog and atmospheric haze"],
                    [/\bnella nebbia\b/gi, "surrounded by atmospheric mist and fog"],
                    [/\bal tramonto\b/gi, "during stunning golden hour sunset, warm rim lighting"],
                    [/\btramonto\b/gi, "golden sunset cinematic lighting"],
                    [/\ball'alba\b/gi, "at early dawn with crisp blue hour ambient light"],
                    [/\balba\b/gi, "dawn lighting"],
                    [/\bcon fulmini\b/gi, "with dramatic lightning flashing in dark storm clouds"],
                    [/\bcon fumo e scintille\b/gi, "with billowing smoke and flying embers"],

                    // Lighting, Camera & Objects
                    [/\bluci al neon\b/gi, "vibrant neon glow casting colored reflections"],
                    [/\bluci soffuse\b/gi, "soft diffused cinematic ambient lighting"],
                    [/\bchiaroscuro\b/gi, "dramatic chiaroscuro contrast lighting"],
                    [/\bprimo piano\b/gi, "tight cinematic close-up shot, shallow depth of field"],
                    [/\bprimissimo piano\b/gi, "extreme close-up on eyes and expressions"],
                    [/\bcampo lungo\b/gi, "wide establishing wide-angle shot, epic sense of scale"],
                    [/\bpiano sequenza\b/gi, "smooth continuous tracking gimbal shot"],
                    [/\binseguimento\b/gi, "high-speed kinetic pursuit with dynamic camera moves"],
                    [/\besplosione\b/gi, "massive cinematic explosion with realistic shockwave and fiery debris"],
                    [/\bmacchina\b/gi, "sleek performance vehicle"],
                    [/\bauto\b/gi, "car"],
                    [/\bpistola\b/gi, "metallic handgun"],
                    [/\bspada\b/gi, "gleaming sword"]
                ];

                let translated = text;
                for (const [re, rep] of dict) {
                    translated = translated.replace(re, rep);
                }

                // Film setup styles
                const filmDescriptions = {
                    "NOIR": "Film look: Film Noir aesthetic, deep dramatic shadows, high contrast chiaroscuro lighting, vintage monochrome detective tone, rich film grain",
                    "Noir Classic": "Film look: Classic 1940s Film Noir, deep Venetian blind shadows, dramatic chiaroscuro contrast, authentic monochrome celluloid texture",
                    "Action": "Film look: High-octane blockbuster action movie style, intense dynamic contrast, kinetic visual energy, gritty color grading, subtle anamorphic lens flare",
                    "Horror": "Film look: Dark atmospheric horror movie style, eerie desaturated tones, deep unsettling shadows, volumetric mist, creepy suspenseful mood",
                    "Comedy": "Film look: Bright vibrant comedy film aesthetic, warm high-key studio lighting, crisp framing, vivid saturated colors, playful cinematic atmosphere",
                    "Epic": "Film look: Grand cinematic epic scale, IMAX 70mm aesthetic, sweeping majestic lighting, rich volumetric haze, dramatic heroic contrast",
                    "Drama": "Film look: Intimate prestige drama cinema style, soft naturalistic lighting, emotional shallow depth of field, subtle organic film grain",
                    "Cinematic 35mm": "Film look: Kodak 35mm motion picture film stock, shallow depth of field, natural organic halation, authentic celluloid texture",
                    "IMAX 70mm": "Film look: Shot on IMAX 70mm cameras, extreme sharpness, breathtaking dynamic range, majestic scale, pristine visual clarity",
                    "Vintage Super 8": "Film look: Vintage Super 8mm retro film stock, warm nostalgic tones, charming film grain, subtle light leaks, retro 1970s color palette",
                    "Anime Style": "Film look: High-end Makoto Shinkai anime aesthetic, lush vibrant lighting, painterly background textures, beautiful particle effects",
                    "Hyperrealistic 8k": "Film look: Hyperrealistic 8k digital cinematography, razor-sharp details, lifelike micro-textures, photorealistic rendering",
                    "General": "Film look: Cinematic 35mm practical photography, natural balanced lighting, shallow depth of field, realistic live-action film texture, premium studio grading"
                };

                // Camera motion styles
                const cameraDescriptions = {
                    "Static Tripod": "Camera motion: Locked-off static tripod shot, stable framing, zero camera wobble",
                    "Pan Left to Right": "Camera motion: Smooth cinematic panning shot moving from left to right across the scene",
                    "Tilt Up": "Camera motion: Dramatic slow tilt upward revealing the subject and towering surroundings",
                    "Slow Zoom In": "Camera motion: Slow intense push-in zoom focusing closer on the subject's face and expression",
                    "Drone FPV": "Camera motion: Fast dynamic FPV drone shot, sweeping aerial perspective with kinetic altitude changes",
                    "360 Orbit": "Camera motion: Smooth 360-degree rotating orbital tracking camera circling around the subject",
                    "Handheld Shake": "Camera motion: Realistic handheld documentary camera with subtle kinetic shake and natural organic movement"
                };

                // Color palette styles
                const colorDescriptions = {
                    "Teal & Orange": "Palette: Iconic Hollywood teal and orange color grading, warm skin tones with cool shadow contrast",
                    "Cyberpunk Neon": "Palette: Vibrant cyberpunk neon color scheme, electric magenta, cyan highlights, and deep inky blacks",
                    "B&W Monochrome": "Palette: High-contrast black and white monochrome grading, rich grayscale tonality, deep shadows",
                    "Warm Sunset": "Palette: Warm golden sunset palette, amber highlights, soft honey tones, and glowing embers",
                    "Cool Moonlight": "Palette: Cool nocturnal blue moonlight tones, icy indigo highlights, and moody silver accents",
                    "Pastel Aesthetic": "Palette: Soft pastel color grading, muted aesthetic hues, gentle contrast, dreamy delicate tones"
                };

                // Lighting styles
                const lightingDescriptions = {
                    "Studio Softbox": "Lighting: Professional three-point studio softbox lighting, clean soft fill, flattering highlights",
                    "Golden Hour": "Lighting: Natural golden hour lighting, low-angle warm sunlight, soft rim glow and long dramatic shadows",
                    "Dramatic Rim Light": "Lighting: Intense dramatic rim backlighting outlining the silhouette with sharp edge separation",
                    "Volumetric Fog": "Lighting: Dense volumetric fog lighting, visible atmospheric god rays, soft light scattering",
                    "Volumetric Fog Light": "Lighting: Dense volumetric fog lighting, visible atmospheric god rays, soft light scattering",
                    "Cyber Neon": "Lighting: Multi-colored neon glow with glowing street reflections and luminous light sources",
                    "Cyber Neon Glow": "Lighting: Multi-colored neon glow with glowing street reflections and luminous light sources",
                    "Low Key Dark": "Lighting: Low-key chiaroscuro lighting, deep mysterious shadows with subtle accent highlights"
                };

                const styleElements = [];
                const activeFilm = setup || filmSetup;
                const activeCam = cam || camera;
                const activeCol = col || colorPalette;
                const activeLight = light || lighting;

                if (activeFilm && activeFilm !== "Auto" && filmDescriptions[activeFilm]) {
                    styleElements.push(filmDescriptions[activeFilm]);
                } else if (activeFilm && activeFilm !== "Auto") {
                    styleElements.push(`Film setup: ${activeFilm}`);
                }

                if (activeCam && activeCam !== "Auto" && cameraDescriptions[activeCam]) {
                    styleElements.push(cameraDescriptions[activeCam]);
                } else if (activeCam && activeCam !== "Auto") {
                    styleElements.push(`Camera motion: ${activeCam}`);
                }

                if (activeCol && activeCol !== "Auto" && colorDescriptions[activeCol]) {
                    styleElements.push(colorDescriptions[activeCol]);
                } else if (activeCol && activeCol !== "Auto") {
                    styleElements.push(`Palette: ${activeCol}`);
                }

                if (activeLight && activeLight !== "Auto" && lightingDescriptions[activeLight]) {
                    styleElements.push(lightingDescriptions[activeLight]);
                } else if (activeLight && activeLight !== "Auto") {
                    styleElements.push(`Lighting: ${activeLight}`);
                }

                let finalPrompt = translated;
                if (styleElements.length > 0) {
                    finalPrompt = `${translated}, ${styleElements.join(", ")}`;
                } else {
                    finalPrompt = `${translated}, Cinematic 35mm practical photography, shallow depth of field, authentic film grain, 8k resolution, realistic live-action textures, natural fluid motion`;
                }

                return finalPrompt;
            };

            // Generate Group with AI Prompt Enhancement Checkbox
            const genGroup = document.createElement("div");
            genGroup.className = "wox-generate-group";

            const enhanceCheckWrap = document.createElement("label");
            enhanceCheckWrap.className = "wox-enhance-checkbox-wrap";
            enhanceCheckWrap.title = "Migliora e arricchisce istantaneamente il prompt traducendolo in inglese cinematografico";

            const enhanceCheckbox = document.createElement("input");
            enhanceCheckbox.type = "checkbox";
            enhanceCheckbox.checked = false; // Disattivato di default

            const enhanceTag = document.createElement("span");
            enhanceTag.className = "wox-enhance-tag";
            enhanceTag.innerText = "AI PROMPT";

            enhanceCheckWrap.appendChild(enhanceCheckbox);
            enhanceCheckWrap.appendChild(enhanceTag);

            // Generate Neon Button
            const genBtn = document.createElement("button");
            genBtn.className = "wox-generate-btn";
            genBtn.innerHTML = `<span>GENERATE</span>`;

            // Very thin progress bar under AI GENERATE
            const progressTrack = document.createElement("div");
            progressTrack.className = "wox-gen-progress-track";

            const progressBar = document.createElement("div");
            progressBar.className = "wox-gen-progress-bar";

            const progressPct = document.createElement("span");
            progressPct.className = "wox-gen-progress-pct";
            progressPct.innerText = "0%";

            progressTrack.appendChild(progressBar);

            const setGenProgress = (pct) => {
                progressTrack.classList.add("active");
                progressPct.classList.add("active");
                progressBar.style.width = `${Math.min(100, Math.max(0, pct))}%`;
                progressPct.innerText = `${Math.round(pct)}%`;
            };

            const resetGenProgress = (delay = 400) => {
                setTimeout(() => {
                    progressTrack.classList.remove("active");
                    progressPct.classList.remove("active");
                    progressBar.style.width = "0%";
                    progressPct.innerText = "0%";
                }, delay);
            };

            genBtn.addEventListener("click", async () => {
                try {
                    // Reset e mostra la barra di progressione
                    setGenProgress(2);

                    // Check if AI Prompt Enhancement is active (Level 2 Direct Engine)
                    if (enhanceCheckbox.checked && promptInput.value.trim().length > 0) {
                        const enhanced = smartTranslateAndEnhance(promptInput.value, filmSetup, camera, colorPalette, lighting);
                        if (enhanced && enhanced !== promptInput.value) {
                            promptInput.value = enhanced;
                            promptInput.dispatchEvent(new Event("input", { bubbles: true }));
                            promptInput.dispatchEvent(new Event("change", { bubbles: true }));
                            updateActiveRefsUI();
                        }
                    }

                    // 1. Force sync all current UI values to underlying node widgets
                    setWidgetValue("prompt", promptInput.value);
                    setWidgetValue("mode", currentMode);
                    setWidgetValue("film_setup", filmSetup);
                    setWidgetValue("camera", camera);
                    setWidgetValue("color_palette", colorPalette);
                    setWidgetValue("lighting", lighting);
                    setWidgetValue("aspect_ratio", aspectRatio);
                    setWidgetValue("resolution", resolution);
                    setWidgetValue("duration", duration);
                    setWidgetValue("audio", audio);
                    setWidgetValue("variations", variations);

                    // 2. Build or sync pipeline with current WOX Cinema settings
                    if (currentMode.includes("Image")) {
                        isGeneratingImage = true;
                        genBtn.innerHTML = `<span>GENERATING...</span>`;
                        
                        // Check if references are used in the prompt or active chips
                        let usedRefs = references.filter(r => r.tag && promptInput.value.includes(r.tag));
                        const activeBadges = activeRefsBar ? Array.from(activeRefsBar.querySelectorAll(".wox-active-ref-chip")) : [];
                        if (activeBadges.length > 0) {
                            activeBadges.forEach(chip => {
                                const tag = chip.querySelector("span")?.innerText;
                                const found = references.find(r => r.tag === tag);
                                if (found && !usedRefs.includes(found)) {
                                    usedRefs.push(found);
                                }
                            });
                        }

                        if (usedRefs.length > 0) {
                            // Strada 2: Pipeline Qwen-Image-Edit con reference visiva condizionata
                            const targetRef = usedRefs[0];
                            const refInputFile = targetRef.filename || targetRef.raw_filename;
                            syncOrBuildQwenImageEditPipeline(refInputFile, promptInput.value);
                            syncPromptToActiveNodes(promptInput.value);
                        } else {
                            // Text-to-image standard (Z-Image Turbo)
                            syncOrBuildZImageTurboPipeline();
                            syncPromptToActiveNodes(promptInput.value);
                        }
                    } else {
                        isGeneratingImage = false;
                        syncOrBuildMiniMaxH3Pipeline();
                        syncPromptToActiveNodes(promptInput.value);
                    }

                    // 3. Trigger prompt queue
                    if (app && app.queuePrompt) {
                        await app.queuePrompt(0);
                    }
                } catch (e) {
                    console.error("WOX Cinema Generate Error:", e);
                    if (app && app.queuePrompt) {
                        await app.queuePrompt(0);
                    }
                }
            });

            genGroup.appendChild(enhanceCheckWrap);
            genGroup.appendChild(genBtn);
            genGroup.appendChild(progressTrack);
            genGroup.appendChild(progressPct);

            actionBar.appendChild(chipsRow);
            actionBar.appendChild(genGroup);

            mainBox.appendChild(promptInput);
            mainBox.appendChild(activeRefsBar);
            mainBox.appendChild(actionBar);

            promptSection.appendChild(modeToggle);
            promptSection.appendChild(mainBox);

            // 5. FOOTER BRANDING TITLE
            const footerBrand = document.createElement("div");
            footerBrand.className = "wox-footer-brand";
            footerBrand.innerHTML = `<div class="wox-footer-main">WOX CINEMA STUDIO <span style="font-size:11px;font-weight:700;color:#94a3b8;margin-left:8px;opacity:0.85;">• MONTAGGIO VIDEO</span></div>`;

            // =================================================================
            // 6. VIDEO MONTAGE & TIMELINE SEQUENCER (SOTTO A WOX CINEMA STUDIO)
            // =================================================================
            const timelineEditor = document.createElement("div");
            timelineEditor.className = "wox-timeline-editor";

            let timelineClips = []; // [ { id, url, filename, duration, title, startOffset, originalDuration } ]
            let isPlaying = false;
            let currentPlayheadTime = 0; // in seconds across whole timeline
            let activePlayingClipIndex = 0;
            let playbackAnimationId = null;
            let currentTimelineTool = "move"; // "move" | "cut" | "delete"
            let selectedClipIndex = null;

            // Format seconds helper (00:00.0)
            const formatTime = (sec) => {
                if (isNaN(sec) || sec < 0) sec = 0;
                const m = Math.floor(sec / 60);
                const s = Math.floor(sec % 60);
                const ms = Math.floor((sec % 1) * 10);
                return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${ms}`;
            };

            const getTotalDuration = () => {
                return timelineClips.reduce((acc, c) => acc + (c.duration || 5.0), 0);
            };

            // 6.1 Timeline Header
            const tlHeader = document.createElement("div");
            tlHeader.className = "wox-timeline-header";

            // Left Side: Aggiungi Clip button + Badge
            const tlLeftWrap = document.createElement("div");
            tlLeftWrap.className = "wox-timeline-title-wrap";

            const tlAddClipBtn = document.createElement("button");
            tlAddClipBtn.className = "wox-tl-btn";
            tlAddClipBtn.innerHTML = `<span>+</span><span>Aggiungi Clip</span>`;
            tlAddClipBtn.style.background = "#222a3a";
            tlAddClipBtn.style.color = "#d4ff32";
            tlAddClipBtn.style.borderColor = "rgba(212, 255, 50, 0.4)";
            tlAddClipBtn.style.fontWeight = "800";

            const tlBadge = document.createElement("div");
            tlBadge.className = "wox-timeline-badge";
            tlBadge.id = "wox-tl-badge";
            tlBadge.innerText = "0 clips • 00:00.0";

            tlLeftWrap.appendChild(tlAddClipBtn);
            tlLeftWrap.appendChild(tlBadge);

            // Right Side Controls: Play, Stop, Esporta Video, Time readout, Clear
            const tlControls = document.createElement("div");
            tlControls.className = "wox-timeline-controls";

            const tlPlayBtn = document.createElement("button");
            tlPlayBtn.className = "wox-tl-btn play-btn";
            tlPlayBtn.innerHTML = `<span>▶</span><span>Play</span>`;

            const tlStopBtn = document.createElement("button");
            tlStopBtn.className = "wox-tl-btn";
            tlStopBtn.innerHTML = `<span>⏹</span><span>Stop</span>`;

            const tlExportBtn = document.createElement("button");
            tlExportBtn.className = "wox-tl-btn export-btn";
            tlExportBtn.innerHTML = `<span>⚡</span><span>Esporta Video</span>`;
            tlExportBtn.style.background = "#d4ff32";
            tlExportBtn.style.color = "#0b0d11";
            tlExportBtn.style.fontWeight = "900";
            tlExportBtn.title = "Genera e unisce tutte le clip in un unico video finale montato";

            const tlTimeDisplay = document.createElement("div");
            tlTimeDisplay.className = "wox-tl-time";
            tlTimeDisplay.innerText = "00:00.0 / 00:00.0";

            const tlClearBtn = document.createElement("button");
            tlClearBtn.className = "wox-tl-btn";
            tlClearBtn.innerHTML = `<span>🗑</span><span>Svuota</span>`;

            const tlFileInput = document.createElement("input");
            tlFileInput.type = "file";
            tlFileInput.accept = "video/*";
            tlFileInput.multiple = true;
            tlFileInput.style.display = "none";

            tlControls.appendChild(tlPlayBtn);
            tlControls.appendChild(tlStopBtn);
            tlControls.appendChild(tlExportBtn);
            tlControls.appendChild(tlTimeDisplay);
            tlControls.appendChild(tlClearBtn);
            tlControls.appendChild(tlFileInput);

            tlHeader.appendChild(tlLeftWrap);
            tlHeader.appendChild(tlControls);

            // 6.2 Monitor Preview Wrap
            const monitorWrap = document.createElement("div");
            monitorWrap.className = "wox-timeline-monitor-wrap";

            const monitorVideo = document.createElement("video");
            monitorVideo.className = "wox-timeline-monitor";
            monitorVideo.playsInline = true;
            monitorVideo.crossOrigin = "anonymous";
            monitorVideo.muted = false;

            const monitorInfo = document.createElement("div");
            monitorInfo.className = "wox-timeline-monitor-info";
            monitorInfo.innerHTML = `
                <div class="wox-monitor-clip-title" id="wox-mon-title">Nessun video in riproduzione</div>
                <div class="wox-monitor-clip-status" id="wox-mon-status">
                    <span>Trascina i clip nella timeline per comporre il video</span>
                </div>
            `;

            monitorWrap.appendChild(monitorVideo);
            monitorWrap.appendChild(monitorInfo);

            // 6.2.5 Toolbar Tra Monitor e Timeline (Sposta, Taglia, Cancella)
            const tlToolbar = document.createElement("div");
            tlToolbar.className = "wox-timeline-toolbar";

            const tlToolsGroup = document.createElement("div");
            tlToolsGroup.className = "wox-tl-tools-group";

            // Tool 1: Sposta (Default)
            const toolMoveBtn = document.createElement("button");
            toolMoveBtn.className = "wox-tl-tool-btn active";
            toolMoveBtn.dataset.tool = "move";
            toolMoveBtn.innerHTML = `
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="5 9 2 12 5 15"></polyline>
                    <polyline points="9 5 12 2 15 5"></polyline>
                    <polyline points="15 19 12 22 9 19"></polyline>
                    <polyline points="19 9 22 12 19 15"></polyline>
                    <line x1="2" y1="12" x2="22" y2="12"></line>
                    <line x1="12" y1="2" x2="12" y2="22"></line>
                </svg>
                <span>Sposta</span>
            `;
            toolMoveBtn.title = "Sposta / Seleziona e riordina clip (Scorciatoia: V)";

            // Tool 2: Cancella
            const toolDeleteBtn = document.createElement("button");
            toolDeleteBtn.className = "wox-tl-tool-btn tool-delete";
            toolDeleteBtn.dataset.tool = "delete";
            toolDeleteBtn.innerHTML = `
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    <line x1="10" y1="11" x2="10" y2="17"></line>
                    <line x1="14" y1="11" x2="14" y2="17"></line>
                </svg>
                <span>Cancella</span>
            `;
            toolDeleteBtn.title = "Cancella / Elimina porzioni di clip cliccandoci sopra (Scorciatoia: Canc)";

            // Pulsante rapido Taglia (stesso stile e colore monocromatico di Sposta)
            const quickSplitBtn = document.createElement("button");
            quickSplitBtn.className = "wox-tl-tool-btn";
            quickSplitBtn.innerHTML = `
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="6" cy="6" r="3"></circle>
                    <circle cx="6" cy="18" r="3"></circle>
                    <line x1="20" y1="4" x2="8.12" y2="15.88"></line>
                    <line x1="14.47" y1="14.48" x2="20" y2="20"></line>
                    <line x1="8.12" y1="8.12" x2="12" y2="12"></line>
                </svg>
                <span>Taglia</span>
            `;
            quickSplitBtn.title = "Taglia la clip nel punto esatto della testina (Scorciatoia: C)";

            const toolHint = document.createElement("div");
            toolHint.className = "wox-tl-tool-hint";
            toolHint.innerHTML = `<span>💡 <b>Sposta:</b> trascina per ordinare • <b>Taglia:</b> divide sulla testina • <b>Cancella:</b> rimuove clip</span>`;

            tlToolsGroup.appendChild(toolMoveBtn);
            tlToolsGroup.appendChild(quickSplitBtn);
            tlToolsGroup.appendChild(toolDeleteBtn);

            tlToolbar.appendChild(tlToolsGroup);
            tlToolbar.appendChild(toolHint);

            const setTimelineTool = (tool) => {
                currentTimelineTool = tool;
                toolMoveBtn.classList.toggle("active", tool === "move");
                toolDeleteBtn.classList.toggle("active", tool === "delete");

                trackArea.classList.toggle("mode-move", tool === "move");
                trackArea.classList.toggle("mode-delete", tool === "delete");

                // Aggiorna draggable sui clip
                const clipEls = trackEl.querySelectorAll(".wox-timeline-clip");
                clipEls.forEach(el => {
                    el.draggable = (tool === "move");
                });

                if (tool === "move") {
                    toolHint.innerHTML = `<span>✋ <b>Sposta attivo:</b> Trascina le clip per riordinarle o selezionale</span>`;
                } else if (tool === "delete") {
                    toolHint.innerHTML = `<span>🗑️ <b>Cancella attivo:</b> Fai clic sulla porzione di clip da rimuovere</span>`;
                }
            };

            toolMoveBtn.addEventListener("click", () => setTimelineTool("move"));
            toolDeleteBtn.addEventListener("click", () => setTimelineTool("delete"));

            // 6.3 Track Area (Ruler + Clips + Playhead)
            const trackArea = document.createElement("div");
            trackArea.className = "wox-timeline-track-area mode-move";

            const rulerEl = document.createElement("div");
            rulerEl.className = "wox-timeline-ruler";

            const trackEl = document.createElement("div");
            trackEl.className = "wox-timeline-track";

            const playheadEl = document.createElement("div");
            playheadEl.className = "wox-timeline-playhead";
            playheadEl.style.left = "0px";

            trackArea.appendChild(rulerEl);
            trackArea.appendChild(trackEl);
            trackArea.appendChild(playheadEl);

            timelineEditor.appendChild(tlHeader);
            timelineEditor.appendChild(monitorWrap);
            timelineEditor.appendChild(tlToolbar);
            timelineEditor.appendChild(trackArea);

            // Probe video duration
            const probeVideoDuration = (url) => {
                return new Promise((resolve) => {
                    const tempVid = document.createElement("video");
                    tempVid.preload = "metadata";
                    let resolved = false;
                    const done = (val) => {
                        if (!resolved) {
                            resolved = true;
                            resolve((val && !isNaN(val) && isFinite(val) && val > 0) ? val : 5.0);
                        }
                    };
                    tempVid.onloadedmetadata = () => done(tempVid.duration);
                    tempVid.ondurationchange = () => done(tempVid.duration);
                    tempVid.onerror = () => done(5.0);
                    tempVid.src = url;
                    if (tempVid.duration && !isNaN(tempVid.duration) && tempVid.duration > 0) {
                        done(tempVid.duration);
                    }
                    setTimeout(() => done(tempVid.duration || 5.0), 1500);
                });
            };

            const addClipToTimeline = async (clipData) => {
                const id = "clip_" + Date.now() + "_" + Math.random().toString(36).substr(2, 4);
                let duration = clipData.duration;
                if (!duration && clipData.url) {
                    duration = await probeVideoDuration(clipData.url);
                }
                duration = duration || 5.0;
                const startOffset = typeof clipData.startOffset === "number" ? clipData.startOffset : 0.0;
                const origDur = typeof clipData.originalDuration === "number" ? clipData.originalDuration : duration;

                timelineClips.push({
                    id,
                    url: clipData.url,
                    filename: clipData.filename || "Video_Clip.mp4",
                    title: clipData.title || clipData.filename || "Clip",
                    duration: parseFloat(duration.toFixed(2)),
                    startOffset: parseFloat(startOffset.toFixed(2)),
                    originalDuration: parseFloat(origDur.toFixed(2))
                });
                renderTimeline();
                if (timelineClips.length === 1) {
                    seekTimeline(0);
                }
            };

            const removeClipFromTimeline = (idx) => {
                if (idx < 0 || idx >= timelineClips.length) return;
                timelineClips.splice(idx, 1);
                if (selectedClipIndex === idx) selectedClipIndex = null;
                else if (selectedClipIndex > idx) selectedClipIndex--;

                if (currentPlayheadTime > getTotalDuration()) {
                    currentPlayheadTime = Math.max(0, getTotalDuration());
                }
                renderTimeline();
                seekTimeline(currentPlayheadTime);
            };

            const reorderClips = (fromIdx, toIdx) => {
                if (fromIdx === toIdx || fromIdx < 0 || toIdx < 0 || fromIdx >= timelineClips.length || toIdx >= timelineClips.length) return;
                const item = timelineClips.splice(fromIdx, 1)[0];
                timelineClips.splice(toIdx, 0, item);
                renderTimeline();
            };

            // Funzione di Taglio (Split) di una clip in due parti a un determinato tempo di offset
            const splitClipAtIndex = (clipIndex, splitOffset) => {
                if (clipIndex < 0 || clipIndex >= timelineClips.length) return;
                const originalClip = timelineClips[clipIndex];
                if (!originalClip) return;

                // Margine minimo di 0.2 secondi per evitare frammenti microscopici
                if (splitOffset <= 0.2 || splitOffset >= originalClip.duration - 0.2) {
                    return;
                }

                const firstDuration = parseFloat(splitOffset.toFixed(2));
                const secondDuration = parseFloat((originalClip.duration - splitOffset).toFixed(2));
                const secondStartOffset = parseFloat(((originalClip.startOffset || 0.0) + splitOffset).toFixed(2));

                const clipA = {
                    ...originalClip,
                    id: "clip_" + Date.now() + "_a",
                    duration: firstDuration
                };

                const clipB = {
                    ...originalClip,
                    id: "clip_" + Date.now() + "_b",
                    title: originalClip.title.includes("part") ? originalClip.title : `${originalClip.title} (part 2)`,
                    duration: secondDuration,
                    startOffset: secondStartOffset
                };

                timelineClips.splice(clipIndex, 1, clipA, clipB);
                selectedClipIndex = clipIndex + 1;
                renderTimeline();
                seekTimeline(currentPlayheadTime);
            };

            // Taglio rapido su posizione corrente della playhead
            quickSplitBtn.addEventListener("click", () => {
                if (timelineClips.length === 0) return;
                let accumulated = 0;
                let foundIndex = -1;
                let offsetInClip = 0;

                for (let i = 0; i < timelineClips.length; i++) {
                    const c = timelineClips[i];
                    if (currentPlayheadTime >= accumulated && currentPlayheadTime <= accumulated + c.duration) {
                        foundIndex = i;
                        offsetInClip = currentPlayheadTime - accumulated;
                        break;
                    }
                    accumulated += c.duration;
                }

                if (foundIndex !== -1) {
                    if (offsetInClip > 0.2 && offsetInClip < timelineClips[foundIndex].duration - 0.2) {
                        splitClipAtIndex(foundIndex, offsetInClip);
                    } else {
                        alert("Sposta la testina (Playhead) all'interno della clip (non sui bordi estremi) per tagliarla.");
                    }
                }
            });

            // Scorciatoie da tastiera per Timeline: V = Sposta, C = Taglia sulla testina, Canc/Backspace = Elimina, Spazio = Play/Pausa
            timelineEditor.tabIndex = 0;
            timelineEditor.addEventListener("keydown", (e) => {
                if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
                if (e.key === "v" || e.key === "V") {
                    setTimelineTool("move");
                } else if (e.key === "c" || e.key === "C") {
                    quickSplitBtn.click();
                } else if (e.key === "Delete" || e.key === "Backspace") {
                    if (selectedClipIndex !== null && selectedClipIndex >= 0 && selectedClipIndex < timelineClips.length) {
                        e.preventDefault();
                        removeClipFromTimeline(selectedClipIndex);
                    }
                } else if (e.code === "Space" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    if (isPlaying) pauseTimeline();
                    else playTimeline();
                }
            });

            // Render Timeline & Ruler
            const renderTimeline = () => {
                const totalDur = getTotalDuration();
                const badgeEl = timelineEditor.querySelector("#wox-tl-badge");
                if (badgeEl) {
                    badgeEl.innerText = `${timelineClips.length} clip${timelineClips.length === 1 ? "" : "s"} • ${formatTime(totalDur)}`;
                }
                tlTimeDisplay.innerText = `${formatTime(currentPlayheadTime)} / ${formatTime(totalDur)}`;

                // Compute exact available track width
                const availableTrackWidth = Math.max(trackArea.clientWidth - 20, timelineClips.length * 130, 400);
                rulerEl.style.width = `${availableTrackWidth}px`;
                trackEl.style.width = `${availableTrackWidth}px`;

                // Render Ruler Ticks
                rulerEl.innerHTML = "";
                const step = totalDur > 30 ? 5 : (totalDur > 10 ? 2 : 1);
                const numTicks = Math.max(5, Math.ceil(totalDur / step));
                for (let i = 0; i <= numTicks; i++) {
                    const t = i * step;
                    const pct = totalDur > 0 ? (t / totalDur) * 100 : (i / numTicks) * 100;
                    if (pct <= 100) {
                        const tick = document.createElement("div");
                        tick.className = "wox-ruler-tick";
                        tick.style.left = `${pct}%`;
                        tick.innerText = `${t}s`;
                        rulerEl.appendChild(tick);
                    }
                }

                // Render Clips
                trackEl.innerHTML = "";
                if (timelineClips.length === 0) {
                    const emptyEl = document.createElement("div");
                    emptyEl.className = "wox-timeline-empty";
                    emptyEl.innerHTML = `<span>📥 Trascina qui i video dall'alto o premi <b>[+ Aggiungi Clip]</b> per montare la sequenza</span>`;
                    
                    emptyEl.addEventListener("dragover", (e) => {
                        e.preventDefault();
                        emptyEl.classList.add("dragover");
                    });
                    emptyEl.addEventListener("dragleave", () => {
                        emptyEl.classList.remove("dragover");
                    });
                    emptyEl.addEventListener("drop", async (e) => {
                        e.preventDefault();
                        emptyEl.classList.remove("dragover");
                        handleTrackDrop(e);
                    });
                    trackEl.appendChild(emptyEl);
                    updatePlayheadUI();
                    return;
                }

                let draggedIdx = null;
                const gapTotal = Math.max(0, (timelineClips.length - 1) * 8);
                const usableWidth = availableTrackWidth - gapTotal;

                timelineClips.forEach((clip, idx) => {
                    const clipEl = document.createElement("div");
                    clipEl.className = "wox-timeline-clip";
                    clipEl.draggable = (currentTimelineTool === "move");
                    clipEl.dataset.idx = idx;

                    if (selectedClipIndex === idx) {
                        clipEl.classList.add("selected");
                    }

                    // Calcola larghezza proporzionale precisa in base alla durata del clip
                    const clipWidth = Math.max(70, Math.floor((clip.duration / Math.max(totalDur, 0.1)) * usableWidth));
                    clipEl.style.width = `${clipWidth}px`;
                    clipEl.style.flex = `0 0 ${clipWidth}px`;
                    clipEl.style.maxWidth = "none";

                    const isTrimmed = (clip.startOffset && clip.startOffset > 0);
                    const trimTag = isTrimmed ? `<span style="color:#38bdf8;font-size:9px;margin-left:3px;" title="Offset inizio: ${clip.startOffset}s">✂</span>` : "";

                    clipEl.innerHTML = `
                        <video class="wox-clip-bg-video" src="${clip.url}" muted preload="metadata"></video>
                        <div class="wox-clip-cut-guide"></div>
                        <div class="wox-clip-trim-handle" title="Trascina verso sinistra per accorciare la clip"></div>
                        <div class="wox-clip-top-info">
                            <span class="wox-clip-idx-badge">#${idx + 1}${trimTag}</span>
                            <button class="wox-clip-del-btn" title="Elimina porzione clip">✕</button>
                        </div>
                        <div class="wox-clip-bottom-info">
                            <span class="wox-clip-name" title="${clip.filename}">${clip.title}</span>
                            <span class="wox-clip-dur">${clip.duration.toFixed(1)}s</span>
                        </div>
                    `;

                    const cutGuide = clipEl.querySelector(".wox-clip-cut-guide");
                    const trimHandle = clipEl.querySelector(".wox-clip-trim-handle");

                    clipEl.querySelector(".wox-clip-del-btn").addEventListener("click", (e) => {
                        e.stopPropagation();
                        removeClipFromTimeline(idx);
                    });

                    // Taglia interattivo con visualizzazione precisa della linea di taglio al passaggio del mouse
                    clipEl.addEventListener("mousemove", (e) => {
                        if (currentTimelineTool === "cut") {
                            const rect = clipEl.getBoundingClientRect();
                            const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
                            if (cutGuide) {
                                cutGuide.style.display = "block";
                                cutGuide.style.left = `${x}px`;
                            }
                        }
                    });

                    clipEl.addEventListener("mouseleave", () => {
                        if (cutGuide) cutGuide.style.display = "none";
                    });

                    // Clic sul clip: Azione dipendente dal tool selezionato (Sposta, Taglia, Cancella)
                    clipEl.addEventListener("click", (e) => {
                        e.stopPropagation();
                        selectedClipIndex = idx;

                        if (currentTimelineTool === "delete") {
                            // Modalità Cancella: Rimuove immediatamente la porzione cliccata
                            removeClipFromTimeline(idx);
                            return;
                        }

                        if (currentTimelineTool === "cut") {
                            // Modalità Taglia: Calcolo del punto di taglio esatto con getBoundingClientRect e clientX
                            const rect = clipEl.getBoundingClientRect();
                            const clickX = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
                            const pct = rect.width > 0 ? (clickX / rect.width) : 0;
                            const splitOffset = parseFloat((pct * clip.duration).toFixed(2));

                            if (splitOffset > 0.2 && splitOffset < clip.duration - 0.2) {
                                splitClipAtIndex(idx, splitOffset);
                            }
                            return;
                        }

                        // Modalità Sposta / Navigazione: Seleziona e sposta playhead all'inizio del clip
                        let startOffset = 0;
                        for (let i = 0; i < idx; i++) startOffset += timelineClips[i].duration;
                        seekTimeline(startOffset);
                        renderTimeline();
                    });

                    // Trimming laterale destro: premi e trascina verso sinistra per cambiare durata
                    let isTrimming = false;
                    let trimStartX = 0;
                    let origClipDur = clip.duration;
                    let origWidthPx = 0;

                    trimHandle.addEventListener("mousedown", (e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        isTrimming = true;
                        trimStartX = e.clientX;
                        origClipDur = clip.duration;
                        origWidthPx = clipEl.offsetWidth || 80;
                        trimHandle.classList.add("trimming");
                        document.body.style.cursor = "ew-resize";

                        const onMouseMove = (moveEvent) => {
                            if (!isTrimming) return;
                            moveEvent.preventDefault();
                            const dx = moveEvent.clientX - trimStartX;
                            // Conversione pixel in secondi basata su scala reale larghezza clip
                            const pxPerSec = (origWidthPx || 80) / Math.max(origClipDur, 0.1);
                            const durDelta = dx / pxPerSec;
                            const maxAllowedDur = clip.originalDuration || (origClipDur * 2);
                            let newDuration = parseFloat(Math.max(0.4, Math.min(maxAllowedDur, origClipDur + durDelta)).toFixed(2));

                            clip.duration = newDuration;

                            // Aggiorna larghezza elemento DOM in tempo reale
                            const newWidth = Math.max(40, Math.round(origWidthPx + dx));
                            clipEl.style.width = `${newWidth}px`;
                            clipEl.style.flex = `0 0 ${newWidth}px`;

                            // Aggiorna display durata in tempo reale sul clip
                            const durEl = clipEl.querySelector(".wox-clip-dur");
                            if (durEl) durEl.innerText = `${newDuration.toFixed(1)}s`;

                            // Ricalcola badge e totale
                            const updatedTotal = getTotalDuration();
                            const badgeEl = timelineEditor.querySelector("#wox-tl-badge");
                            if (badgeEl) {
                                badgeEl.innerText = `${timelineClips.length} clip${timelineClips.length === 1 ? "" : "s"} • ${formatTime(updatedTotal)}`;
                            }
                            tlTimeDisplay.innerText = `${formatTime(currentPlayheadTime)} / ${formatTime(updatedTotal)}`;
                        };

                        const onMouseUp = () => {
                            if (isTrimming) {
                                isTrimming = false;
                                trimHandle.classList.remove("trimming");
                                document.body.style.cursor = "";
                                window.removeEventListener("mousemove", onMouseMove);
                                window.removeEventListener("mouseup", onMouseUp);
                                renderTimeline();
                                seekTimeline(currentPlayheadTime);
                            }
                        };

                        window.addEventListener("mousemove", onMouseMove);
                        window.addEventListener("mouseup", onMouseUp);
                    });

                    // Drag & drop reordering (attivo solo in modalità Move)
                    clipEl.addEventListener("dragstart", (e) => {
                        if (currentTimelineTool !== "move" || isTrimming) {
                            e.preventDefault();
                            return;
                        }
                        draggedIdx = idx;
                        clipEl.classList.add("dragging");
                        e.dataTransfer.setData("text/plain", idx);
                    });
                    clipEl.addEventListener("dragend", () => {
                        clipEl.classList.remove("dragging");
                    });
                    clipEl.addEventListener("dragover", (e) => {
                        if (currentTimelineTool === "move") {
                            e.preventDefault();
                        }
                    });
                    clipEl.addEventListener("drop", (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        if (currentTimelineTool === "move") {
                            if (draggedIdx !== null && draggedIdx !== idx) {
                                reorderClips(draggedIdx, idx);
                            } else {
                                handleTrackDrop(e, idx);
                            }
                        }
                    });

                    trackEl.appendChild(clipEl);
                });

                updatePlayheadUI();
            };

            const handleTrackDrop = (e, insertAtIdx = null) => {
                const jsonStr = e.dataTransfer.getData("application/json");
                if (jsonStr) {
                    try {
                        const data = JSON.parse(jsonStr);
                        if (data.type === "wox_video" && data.url) {
                            addClipToTimeline({
                                url: data.url,
                                filename: data.filename,
                                title: data.filename || "Video Clip"
                            });
                            return;
                        }
                    } catch (err) {}
                }

                // Check text url
                const textUrl = e.dataTransfer.getData("text/plain") || e.dataTransfer.getData("text/uri-list");
                if (textUrl && (textUrl.includes(".mp4") || textUrl.includes(".webm") || textUrl.includes("/wox_cinema/view_video") || textUrl.startsWith("http"))) {
                    const fn = textUrl.split("/").pop().split("?")[0];
                    addClipToTimeline({
                        url: textUrl,
                        filename: fn,
                        title: fn
                    });
                    return;
                }

                // Check dropped files
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                    for (let i = 0; i < e.dataTransfer.files.length; i++) {
                        const file = e.dataTransfer.files[i];
                        if (file.type.startsWith("video/")) {
                            const blobUrl = URL.createObjectURL(file);
                            addClipToTimeline({
                                url: blobUrl,
                                filename: file.name,
                                title: file.name
                            });
                        }
                    }
                }
            };

            // Seek playback to exact time (T)
            const seekTimeline = (targetTime) => {
                const totalDur = getTotalDuration();
                if (totalDur === 0) {
                    currentPlayheadTime = 0;
                    updatePlayheadUI();
                    return;
                }
                currentPlayheadTime = Math.max(0, Math.min(totalDur, targetTime));
                tlTimeDisplay.innerText = `${formatTime(currentPlayheadTime)} / ${formatTime(totalDur)}`;

                // Find active clip
                let accumulated = 0;
                let foundIndex = 0;
                let localOffset = 0;

                for (let i = 0; i < timelineClips.length; i++) {
                    const c = timelineClips[i];
                    if (currentPlayheadTime >= accumulated && currentPlayheadTime <= accumulated + c.duration) {
                        foundIndex = i;
                        localOffset = currentPlayheadTime - accumulated;
                        break;
                    }
                    accumulated += c.duration;
                }

                activePlayingClipIndex = foundIndex;
                const activeClip = timelineClips[foundIndex];

                if (activeClip) {
                    const titleEl = timelineEditor.querySelector("#wox-mon-title");
                    const statusEl = timelineEditor.querySelector("#wox-mon-status");
                    if (titleEl) titleEl.innerText = `[Clip #${foundIndex + 1}] ${activeClip.title}`;
                    if (statusEl) statusEl.innerHTML = `<span class="active-tag">${formatTime(localOffset)} / ${formatTime(activeClip.duration)}</span> • Sequenza totale: ${formatTime(currentPlayheadTime)}`;

                    if (monitorVideo.src !== activeClip.url && !monitorVideo.src.endsWith(activeClip.url)) {
                        monitorVideo.src = activeClip.url;
                    }
                    try {
                        const effectiveVideoTime = (activeClip.startOffset || 0.0) + localOffset;
                        monitorVideo.currentTime = effectiveVideoTime;
                    } catch (err) {}
                }

                updatePlayheadUI();
            };

            const updatePlayheadUI = () => {
                const totalDur = getTotalDuration();
                if (totalDur === 0) {
                    playheadEl.style.left = "8px";
                    return;
                }
                const trackWidth = Math.max(trackEl.clientWidth || 1, 1);
                const pct = Math.max(0, Math.min(1, currentPlayheadTime / totalDur));
                const leftPx = 8 + (pct * trackWidth);
                playheadEl.style.left = `${leftPx}px`;

                // Highlight active playing clip
                const clipEls = trackEl.querySelectorAll(".wox-timeline-clip");
                clipEls.forEach((el, idx) => {
                    if (idx === activePlayingClipIndex && timelineClips.length > 0) {
                        el.classList.add("active-playing");
                    } else {
                        el.classList.remove("active-playing");
                    }
                });
            };

            // Playback loop
            const playTimeline = () => {
                if (timelineClips.length === 0) return;
                const totalDur = getTotalDuration();
                if (currentPlayheadTime >= totalDur) {
                    currentPlayheadTime = 0;
                }
                isPlaying = true;
                tlPlayBtn.innerHTML = `<span>⏸</span><span>Pausa</span>`;
                tlPlayBtn.classList.add("playing");
                playheadEl.classList.add("playing");

                seekTimeline(currentPlayheadTime);
                monitorVideo.play().catch(() => {});

                let lastTimestamp = performance.now();

                const tick = (now) => {
                    if (!isPlaying) return;
                    const dt = (now - lastTimestamp) / 1000;
                    lastTimestamp = now;

                    currentPlayheadTime += dt;
                    const totalD = getTotalDuration();

                    if (currentPlayheadTime >= totalD) {
                        currentPlayheadTime = totalD;
                        pauseTimeline();
                        seekTimeline(totalD);
                        return;
                    }

                    // Check if we need to switch clip
                    let accumulated = 0;
                    let nextIdx = 0;
                    let localTime = 0;
                    for (let i = 0; i < timelineClips.length; i++) {
                        const c = timelineClips[i];
                        if (currentPlayheadTime >= accumulated && currentPlayheadTime <= accumulated + c.duration) {
                            nextIdx = i;
                            localTime = currentPlayheadTime - accumulated;
                            break;
                        }
                        accumulated += c.duration;
                    }

                    if (nextIdx !== activePlayingClipIndex) {
                        activePlayingClipIndex = nextIdx;
                        const nextClip = timelineClips[nextIdx];
                        monitorVideo.src = nextClip.url;
                        const effTime = (nextClip.startOffset || 0.0) + localTime;
                        monitorVideo.currentTime = effTime;
                        monitorVideo.play().catch(() => {});
                    }

                    tlTimeDisplay.innerText = `${formatTime(currentPlayheadTime)} / ${formatTime(totalD)}`;
                    const activeClip = timelineClips[activePlayingClipIndex];
                    if (activeClip) {
                        const titleEl = timelineEditor.querySelector("#wox-mon-title");
                        const statusEl = timelineEditor.querySelector("#wox-mon-status");
                        if (titleEl) titleEl.innerText = `[Clip #${activePlayingClipIndex + 1}] ${activeClip.title}`;
                        if (statusEl) statusEl.innerHTML = `<span class="active-tag">${formatTime(localTime)} / ${formatTime(activeClip.duration)}</span> • Sequenza totale: ${formatTime(currentPlayheadTime)}`;
                    }

                    updatePlayheadUI();
                    playbackAnimationId = requestAnimationFrame(tick);
                };

                playbackAnimationId = requestAnimationFrame(tick);
            };

            const pauseTimeline = () => {
                isPlaying = false;
                if (playbackAnimationId) cancelAnimationFrame(playbackAnimationId);
                tlPlayBtn.innerHTML = `<span>▶</span><span>Play</span>`;
                tlPlayBtn.classList.remove("playing");
                playheadEl.classList.remove("playing");
                monitorVideo.pause();
            };

            const stopTimeline = () => {
                pauseTimeline();
                seekTimeline(0);
            };

            tlPlayBtn.addEventListener("click", () => {
                if (isPlaying) pauseTimeline();
                else playTimeline();
            });

            tlStopBtn.addEventListener("click", stopTimeline);

            tlClearBtn.addEventListener("click", () => {
                if (timelineClips.length > 0 && confirm("Svuotare tutte le clip della timeline?")) {
                    stopTimeline();
                    timelineClips = [];
                    renderTimeline();
                }
            });

            // Controllo riproduzione Timeline con tasto Spazio quando si clicca dentro WOX Cinema
            let isWoxActive = false;

            const handleWoxPointerDown = (e) => {
                isWoxActive = container.contains(e.target);
            };
            document.addEventListener("pointerdown", handleWoxPointerDown, true);

            const handleWoxKeyDown = (e) => {
                if (e.code === "Space" || e.key === " ") {
                    const tag = e.target ? e.target.tagName : "";
                    if (tag === "INPUT" || tag === "TEXTAREA" || (e.target && e.target.isContentEditable)) {
                        return;
                    }

                    if (isWoxActive || container.contains(document.activeElement) || container.contains(e.target)) {
                        e.preventDefault();
                        e.stopPropagation();
                        e.stopImmediatePropagation();

                        if (isPlaying) {
                            pauseTimeline();
                        } else {
                            playTimeline();
                        }
                    }
                }
            };
            window.addEventListener("keydown", handleWoxKeyDown, true);

            const origOnRemoved = node.onRemoved;
            node.onRemoved = () => {
                if (origOnRemoved) origOnRemoved.apply(node, arguments);
                document.removeEventListener("pointerdown", handleWoxPointerDown, true);
                window.removeEventListener("keydown", handleWoxKeyDown, true);
            };

            // Scrubbing & Dragging on Ruler, Playhead Scrubber and Track Area
            let isScrubbing = false;
            let wasPlayingBeforeScrub = false;

            const handleTrackScrub = (clientX) => {
                const totalDur = getTotalDuration();
                if (totalDur <= 0) return;
                const trackRect = trackEl.getBoundingClientRect();
                const clickX = clientX - trackRect.left;
                const width = Math.max(trackRect.width, 1);
                const pct = Math.max(0, Math.min(1, clickX / width));
                const targetTime = pct * totalDur;
                seekTimeline(targetTime);
            };

            const startScrubbing = (e) => {
                if (timelineClips.length === 0) return;
                // Only primary button
                if (e.button !== 0) return;
                e.preventDefault();
                e.stopPropagation();

                isScrubbing = true;
                wasPlayingBeforeScrub = isPlaying;
                if (isPlaying) {
                    pauseTimeline();
                }

                document.body.style.cursor = "ew-resize";
                handleTrackScrub(e.clientX);

                const onScrubMove = (moveEv) => {
                    if (!isScrubbing) return;
                    moveEv.preventDefault();
                    handleTrackScrub(moveEv.clientX);
                };

                const onScrubUp = () => {
                    if (isScrubbing) {
                        isScrubbing = false;
                        document.body.style.cursor = "";
                        window.removeEventListener("mousemove", onScrubMove);
                        window.removeEventListener("mouseup", onScrubUp);
                    }
                };

                window.addEventListener("mousemove", onScrubMove);
                window.addEventListener("mouseup", onScrubUp);
            };

            rulerEl.addEventListener("mousedown", startScrubbing);
            playheadEl.addEventListener("mousedown", startScrubbing);
            trackArea.addEventListener("mousedown", (e) => {
                if (e.target === trackArea || e.target === rulerEl || e.target === playheadEl) {
                    startScrubbing(e);
                }
            });

            // Open Output Videos Selection Modal & Explorer
            const openOutputVideosModal = async () => {
                let res = null;
                try {
                    res = await fetch(`/wox_cinema/recent_videos?_t=${Date.now()}`, { cache: "no-store" });
                } catch (e) {
                    res = await api.fetchApi(`/wox_cinema/recent_videos?_t=${Date.now()}`);
                }
                let vids = [];
                if (res && res.ok) {
                    const data = await res.json();
                    vids = data.recent_videos || [];
                }

                modalBackdrop.innerHTML = `
                    <div class="wox-modal" style="max-width: 780px;">
                        <div class="wox-modal-header">
                            <div class="wox-modal-title" style="font-weight:900;font-size:14px;color:#d4ff32;display:flex;align-items:center;gap:8px;">
                                📁 Video Cartella Output (${vids.length})
                            </div>
                            <div style="display:flex;align-items:center;gap:8px;">
                                <button class="wox-tl-btn" id="wox-modal-open-folder-btn" style="background:#273142;color:#fff;">
                                    📁 Apri Cartella in Explorer
                                </button>
                                <button class="wox-tl-btn" id="wox-modal-browse-file-btn" style="background:#273142;color:#d4ff32;">
                                    + Sfoglia da Disco
                                </button>
                                <button class="wox-modal-close" title="Chiudi">✕</button>
                            </div>
                        </div>
                        <div class="wox-modal-body" style="max-height: 480px; overflow-y: auto; padding: 14px;">
                            <div class="wox-ref-grid" id="wox-output-videos-grid"></div>
                        </div>
                    </div>
                `;

                const grid = modalBackdrop.querySelector("#wox-output-videos-grid");
                
                if (vids.length === 0) {
                    grid.innerHTML = `
                        <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #64748b;">
                            Nessun video trovato nella cartella output/video.<br><br>
                            <button class="wox-tl-btn" id="wox-browse-empty-btn" style="margin: 0 auto; background:#d4ff32; color:#000;">
                                📁 Sfoglia file dal computer
                            </button>
                        </div>
                    `;
                    const browseBtn = grid.querySelector("#wox-browse-empty-btn");
                    if (browseBtn) browseBtn.addEventListener("click", () => {
                        tlFileInput.click();
                        modalBackdrop.classList.remove("open");
                    });
                } else {
                    vids.forEach((v, idx) => {
                        const card = document.createElement("div");
                        card.className = "wox-ref-card";
                        card.style.cursor = "pointer";
                        
                        card.innerHTML = `
                            <video class="wox-ref-thumb" src="${v.url}" muted loop playsinline autoplay style="object-fit:cover;height:110px;"></video>
                            <div class="wox-ref-info" style="display:flex;justify-content:space-between;align-items:center;padding:6px 8px;">
                                <span class="wox-ref-tag" style="font-size:11px;font-weight:700;color:#f1f5f9;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px;">${v.filename}</span>
                                <span style="font-size:10px;color:#d4ff32;font-weight:800;">+ Aggiungi</span>
                            </div>
                        `;

                        card.addEventListener("click", () => {
                            addClipToTimeline({
                                url: v.url,
                                filename: v.filename,
                                title: v.filename
                            });
                            modalBackdrop.classList.remove("open");
                        });

                        grid.appendChild(card);
                    });
                }

                modalBackdrop.classList.add("open");

                modalBackdrop.querySelector(".wox-modal-close").addEventListener("click", () => {
                    modalBackdrop.classList.remove("open");
                });

                modalBackdrop.addEventListener("click", (e) => {
                    if (e.target === modalBackdrop) modalBackdrop.classList.remove("open");
                });

                const openFolderBtn = modalBackdrop.querySelector("#wox-modal-open-folder-btn");
                if (openFolderBtn) {
                    openFolderBtn.addEventListener("click", async () => {
                        try {
                            await fetch("/wox_cinema/open_output_folder");
                        } catch (err) {}
                    });
                }

                const browseBtn = modalBackdrop.querySelector("#wox-modal-browse-file-btn");
                if (browseBtn) {
                    browseBtn.addEventListener("click", () => {
                        tlFileInput.click();
                        modalBackdrop.classList.remove("open");
                    });
                }
            };

            // Add clip button opens Output Videos modal popup
            tlAddClipBtn.addEventListener("click", () => {
                openOutputVideosModal();
            });

            // Export Video button: Concatenates all timeline clips into a single output video
            tlExportBtn.addEventListener("click", async () => {
                if (!timelineClips || timelineClips.length === 0) {
                    alert("Aggiungi almeno una clip alla timeline per esportare il video finale.");
                    return;
                }

                const origHtml = tlExportBtn.innerHTML;
                tlExportBtn.disabled = true;
                tlExportBtn.innerHTML = `<span>⏳</span><span>Elaborazione...</span>`;

                try {
                    const res = await fetch("/wox_cinema/export_montage", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ clips: timelineClips })
                    });

                    if (res.ok) {
                        const data = await res.json();
                        if (data.success && data.url) {
                            tlExportBtn.innerHTML = `<span>✓</span><span>Esportato!</span>`;
                            fetchRecentVideos();
                            
                            // Carica e riproduce il video finale esportato nel monitor
                            monitorVideo.src = data.url;
                            monitorVideo.play().catch(() => {});
                            const titleEl = timelineEditor.querySelector("#wox-mon-title");
                            const statusEl = timelineEditor.querySelector("#wox-mon-status");
                            if (titleEl) titleEl.innerText = `[Video Finale Esportato] ${data.filename}`;
                            if (statusEl) statusEl.innerHTML = `<span class="active-tag" style="color:#d4ff32;">✓ Salvato con successo in output/video</span>`;
                        } else {
                            alert("Errore esportazione: " + (data.error || "Errore sconosciuto"));
                        }
                    } else {
                        const err = await res.text();
                        alert("Errore durante il montaggio: " + err);
                    }
                } catch (e) {
                    console.error("Export montage error:", e);
                    alert("Errore durante l'esportazione: " + e.message);
                } finally {
                    setTimeout(() => {
                        tlExportBtn.disabled = false;
                        tlExportBtn.innerHTML = origHtml;
                    }, 3000);
                }
            });

            tlFileInput.addEventListener("change", (e) => {
                if (e.target.files && e.target.files.length > 0) {
                    for (let i = 0; i < e.target.files.length; i++) {
                        const f = e.target.files[i];
                        const blobUrl = URL.createObjectURL(f);
                        addClipToTimeline({
                            url: blobUrl,
                            filename: f.name,
                            title: f.name
                        });
                    }
                }
            });

            renderTimeline();

            // Append everything to main container
            container.appendChild(galleryWrapper);
            container.appendChild(titleEl);
            container.appendChild(pillsBar);
            container.appendChild(promptSection);
            container.appendChild(footerBrand);
            container.appendChild(timelineEditor);

            // Add DOM Widget to Node
            const domWidget = node.addDOMWidget("wox_cinema_interface", "custom_ui", container, {
                getValue() {
                    return promptInput.value;
                },
                setValue(v) {
                    if (v && promptInput) promptInput.value = v;
                },
                hideOnZoom: false,
                selectOnHover: false
            });

            if (domWidget) {
                domWidget.hideOnZoom = false;
                domWidget.serialize = false;
                const origDraw = domWidget.draw;
                domWidget.draw = function(ctx, node, widget_width, y, widget_height) {
                    if (origDraw) {
                        try { origDraw.apply(this, arguments); } catch (e) {}
                    }
                    if (container) {
                        container.style.visibility = "visible";
                        container.hidden = false;
                    }
                };
                domWidget.computeSize = function(width) {
                    const h = Math.max(800, container.scrollHeight || 800);
                    return [node.size[0] || 820, h];
                };
            }

            // Keep widget visible at any canvas zoom level (including 143%+)
            node.flags = node.flags || {};
            node.flags.hideOnZoom = false;

            const origDrawForeground = node.onDrawForeground;
            node.onDrawForeground = function(ctx) {
                if (origDrawForeground) {
                    try { origDrawForeground.apply(this, arguments); } catch (e) {}
                }
                if (container) {
                    container.style.visibility = "visible";
                    container.hidden = false;
                }
            };

            // WebSocket listener for live progress
            api.addEventListener("progress", (event) => {
                const { value, max } = event.detail || {};
                if (max && max > 0) {
                    const pct = (value / max) * 100;
                    setGenProgress(pct);
                }
            });

            // WebSocket listeners for live video generation updates
            api.addEventListener("wox_cinema_video_generated", (event) => {
                setGenProgress(100);
                resetGenProgress(600);
                setTimeout(() => {
                    fetchRecentVideos();
                    fetchReferences();
                }, 800);
            });

            // WebSocket listener for live image generation updates (Z-Image Turbo)
            api.addEventListener("wox_cinema_image_generated", async (event) => {
                setGenProgress(100);
                resetGenProgress(600);
                isGeneratingImage = false;
                genBtn.innerHTML = `<span>GENERATE</span>`;
                const detail = event.detail || {};
                await fetchReferences();
                await fetchRecentImages();
                if (currentEditSession && currentEditSession.active) {
                    // Stai nel popup di Edit: NON aprire alcuna preview placeholder!
                    return;
                }
                if (currentMode.includes("Image")) {
                    renderGallery();
                    // Non aprire popup automatici di placeholder durante la generazione
                }
            });

            api.addEventListener("executed", async (event) => {
                setTimeout(() => {
                    fetchRecentVideos();
                    fetchRecentImages();
                    fetchReferences();
                }, 1200);

                // Check if images or videos were output by this execution (SaveImage / SaveVideo)
                if (event.detail && event.detail.output && event.detail.output.images && event.detail.output.images.length > 0) {
                    setGenProgress(100);
                    resetGenProgress(600);
                    isGeneratingImage = false;
                    genBtn.innerHTML = `<span>GENERATE</span>`;
                    const images = event.detail.output.images;
                    const latest = images[images.length - 1];
                    const sub = latest.subfolder ? `&subfolder=${latest.subfolder}` : "";
                    const imgUrl = `/view?filename=${latest.filename}${sub}&type=${latest.type || "output"}`;
                    const promptVal = promptInput?.value || "";
                    const isVideoFile = !!(latest.filename && latest.filename.match(/\.(mp4|webm|mov|mkv|gif)$/i));

                    // Assicurati che il nuovo file non sia bloccato da un vecchio tombstone
                    removeDeletedRef(latest.filename);

                    const cleanTag = `@${latest.filename.split(".")[0].replace(/[^a-zA-Z0-9_]/g, "_").toLowerCase()}`;

                    if (isVideoFile) {
                        const newRecentVid = {
                            id: 1,
                            filename: latest.filename,
                            url: imgUrl,
                            name: latest.filename,
                            tag: "MiniMax H3 Video",
                            media_type: "video",
                            time: Date.now() / 1000,
                            prompt: promptVal
                        };
                        recentVideos = [
                            newRecentVid,
                            ...recentVideos.filter(v => (v.filename || "").toLowerCase() !== latest.filename.toLowerCase())
                        ];
                        if (!currentMode.includes("Image")) {
                            renderGallery();
                        }
                    } else {
                        const newRecentImg = {
                            id: 1,
                            filename: latest.filename,
                            url: imgUrl,
                            name: latest.filename,
                            tag: cleanTag,
                            media_type: "image",
                            time: Date.now() / 1000,
                            prompt: promptVal
                        };
                        recentImages = [
                            newRecentImg,
                            ...recentImages.filter(img => (img.filename || "").toLowerCase() !== latest.filename.toLowerCase())
                        ];
                        if (currentMode.includes("Image")) {
                            renderGallery();
                        }
                    }

                    try {
                        await fetch("/wox_cinema/register_generation", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                filename: latest.filename,
                                subfolder: latest.subfolder || "",
                                prompt: promptVal
                            })
                        });
                    } catch (err) {
                        console.warn("Register generation error:", err);
                    }

                    await fetchReferences();
                    await fetchRecentVideos();
                    await fetchRecentImages();
                    renderGallery();

                    // If an Edit Session is active in the modal, update the image in place and keep modal OPEN!
                    if (currentEditSession && currentEditSession.active) {
                        currentEditSession.updateImage(imgUrl, latest.filename);
                        renderGallery();
                        return; // Non aprire modal esterni, rimani sull'immagine modificata!
                    } else if (isVideoFile) {
                        renderGallery();
                        openImagePreviewModal({
                            url: imgUrl,
                            filename: latest.filename,
                            tag: cleanTag,
                            prompt: promptVal,
                            media_type: "video"
                        });
                    } else if (currentMode.includes("Image")) {
                        renderGallery();
                        openImagePreviewModal({
                            url: imgUrl,
                            filename: latest.filename,
                            tag: cleanTag,
                            prompt: promptVal,
                            media_type: "image"
                        });
                    }
                }
            });

            api.addEventListener("execution_error", (err) => {
                resetGenProgress(100);
                isGeneratingImage = false;
                genBtn.innerHTML = `<span>GENERATE</span>`;
                if (currentEditSession && currentEditSession.active) {
                    currentEditSession.onError(err?.detail?.exception_message || "Errore durante l'esecuzione del workflow ComfyUI.");
                }
            });

            // =========================================================================
            // WOX CINEMA - SYSTEM NODES & MODULES INSTALLER MODAL
            // =========================================================================
            const openSetupModal = async () => {
                let existingBackdrop = document.querySelector(".wox-setup-backdrop");
                if (existingBackdrop) existingBackdrop.remove();

                const backdrop = document.createElement("div");
                backdrop.className = "wox-setup-backdrop open";

                const modal = document.createElement("div");
                modal.className = "wox-setup-modal";

                modal.innerHTML = `
                    <div class="wox-setup-header">
                        <div class="wox-setup-header-title">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#d4ff32" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                                <circle cx="12" cy="12" r="3"></circle>
                                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                            </svg>
                            <span style="font-weight: 800; font-size: 14px; letter-spacing: 0.5px;">INSTALLAZIONE MODULI & NODI COMBO</span>
                            <span class="wox-setup-header-badge">AUTO-SETUP</span>
                        </div>
                        <button class="wox-modal-close-btn" id="wox-setup-close-btn">&times;</button>
                    </div>
                    <div class="wox-setup-body">
                        <div class="wox-setup-actions">
                            <div style="font-size: 12px; color: #94a3b8; max-width: 380px; line-height: 1.4;">
                                Verifica e installa automaticamente tutti i nodi custom e i moduli Python necessari per il corretto funzionamento di WOX Cinema Studio.
                            </div>
                            <button class="wox-setup-install-btn" id="wox-start-install-btn">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                                    <polyline points="7 10 12 15 17 10"></polyline>
                                    <line x1="12" y1="15" x2="12" y2="3"></line>
                                </svg>
                                INSTALLAZIONE MODULI E NODI
                            </button>
                        </div>

                        <div class="wox-setup-progress-container" id="wox-setup-progress-box">
                            <!-- BARRA 1: AVANZAMENTO GENERALE / GLOBALE -->
                            <div class="wox-setup-progress-group generic-progress-group">
                                <div class="wox-setup-progress-header">
                                    <div class="wox-setup-progress-title">
                                        <span class="wox-progress-badge generic">GENERALE</span>
                                        <span id="wox-setup-global-status">Avanzamento Globale: in attesa</span>
                                    </div>
                                    <span id="wox-setup-global-percent" class="wox-progress-pct-text">0%</span>
                                </div>
                                <div class="wox-setup-progress-track">
                                    <div class="wox-setup-progress-fill generic-fill" id="wox-setup-global-bar"></div>
                                </div>
                            </div>

                            <!-- BARRA 2: AVANZAMENTO DEDICATO ALL'ELEMENTO (MODULO / NODO / MODELLO) -->
                            <div class="wox-setup-progress-group item-progress-group">
                                <div class="wox-setup-progress-header">
                                    <div class="wox-setup-progress-title">
                                        <span class="wox-progress-badge item" id="wox-setup-item-badge">ELEMENTO</span>
                                        <span id="wox-setup-item-status">In attesa dell'elemento...</span>
                                    </div>
                                    <span id="wox-setup-item-percent" class="wox-progress-pct-text">0%</span>
                                </div>
                                <div class="wox-setup-progress-track">
                                    <div class="wox-setup-progress-fill item-fill" id="wox-setup-item-bar"></div>
                                </div>
                                <div class="wox-setup-progress-details">
                                    <div class="wox-setup-progress-log" id="wox-setup-log-line">In attesa di avvio...</div>
                                    <div class="wox-setup-speed-tag" id="wox-setup-speed-tag"></div>
                                </div>
                            </div>
                        </div>

                        <div class="wox-setup-section-title">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>
                            Nodi Custom Necessari (ComfyUI)
                        </div>
                        <div class="wox-setup-list" id="wox-nodes-list">
                            <div style="padding: 10px; font-size: 11px; color: #64748b;">Controllo stato dei nodi in corso...</div>
                        </div>

                        <div class="wox-setup-section-title" style="margin-top: 8px;">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M16.5 9.4 7.55 4.24a1.78 1.78 0 0 0-2.5 1.55v12.42a1.78 1.78 0 0 0 2.5 1.55L16.5 14.6a1.78 1.78 0 0 0 0-3.2z"></path></svg>
                            Moduli Python Necessari
                        </div>
                        <div class="wox-setup-list" id="wox-modules-list">
                            <div style="padding: 10px; font-size: 11px; color: #64748b;">Controllo stato dei moduli in corso...</div>
                        </div>

                        <div class="wox-setup-section-title" style="margin-top: 8px;">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>
                            Modelli AI e Checkpoints (ComfyUI Models)
                        </div>
                        <div class="wox-setup-list" id="wox-models-list">
                            <div style="padding: 10px; font-size: 11px; color: #64748b;">Controllo stato dei modelli in corso...</div>
                        </div>
                    </div>
                `;

                backdrop.appendChild(modal);
                document.body.appendChild(backdrop);

                const cleanupModal = () => {
                    if (onInstallProgress) {
                        api.removeEventListener("wox_cinema_install_progress", onInstallProgress);
                    }
                    backdrop.remove();
                };

                const closeBtn = modal.querySelector("#wox-setup-close-btn");
                closeBtn.addEventListener("click", cleanupModal);
                backdrop.addEventListener("click", (e) => {
                    if (e.target === backdrop) cleanupModal();
                });

                let systemData = null;
                const nodesListEl = modal.querySelector("#wox-nodes-list");
                const modulesListEl = modal.querySelector("#wox-modules-list");
                const modelsListEl = modal.querySelector("#wox-models-list");
                const installBtn = modal.querySelector("#wox-start-install-btn");
                const progressBox = modal.querySelector("#wox-setup-progress-box");
                const globalBar = modal.querySelector("#wox-setup-global-bar");
                const globalStatus = modal.querySelector("#wox-setup-global-status");
                const globalPercent = modal.querySelector("#wox-setup-global-percent");
                const itemBar = modal.querySelector("#wox-setup-item-bar");
                const itemStatus = modal.querySelector("#wox-setup-item-status");
                const itemPercent = modal.querySelector("#wox-setup-item-percent");
                const itemBadge = modal.querySelector("#wox-setup-item-badge");
                const logLine = modal.querySelector("#wox-setup-log-line");
                const speedTag = modal.querySelector("#wox-setup-speed-tag");

                const onInstallProgress = (event) => {
                    const data = event.detail;
                    if (!data) return;
                    if (data.percent !== undefined) {
                        const p = Math.min(100, Math.max(0, data.percent));
                        if (itemBar) itemBar.style.width = `${p}%`;
                        if (itemPercent) itemPercent.innerText = `${Math.round(p)}%`;
                    }
                    if (data.log && logLine) {
                        logLine.innerText = data.log;
                    }
                    if (data.name && itemStatus) {
                        itemStatus.innerText = data.name;
                    }
                    if (data.type && itemBadge) {
                        const badgeMap = { model: "MODELLO", node: "NODO", module: "MODULO" };
                        itemBadge.innerText = badgeMap[data.type] || (data.type || "ELEMENTO").toUpperCase();
                    }
                    if (data.speed_str && speedTag) {
                        speedTag.innerText = data.speed_str + (data.eta_str ? ` • ${data.eta_str}` : "");
                        speedTag.style.display = "inline-block";
                    } else if (speedTag && !data.speed_str) {
                        speedTag.style.display = "none";
                    }
                };
                api.addEventListener("wox_cinema_install_progress", onInstallProgress);

                const renderItems = () => {
                    if (!systemData) return;
                    nodesListEl.innerHTML = "";
                    (systemData.nodes || []).forEach(nodeItem => {
                        const row = document.createElement("div");
                        row.className = "wox-setup-item";
                        row.id = `item-node-${nodeItem.id}`;
                        row.innerHTML = `
                            <div class="wox-setup-item-info">
                                <div class="wox-setup-item-name">
                                    ${nodeItem.name}
                                    <span style="font-size: 10px; color: #64748b; font-weight: normal;">(${nodeItem.folder})</span>
                                </div>
                                <div class="wox-setup-item-desc">${nodeItem.description}</div>
                            </div>
                            <div class="wox-setup-status-badge ${nodeItem.installed ? "installed" : "missing"}" id="badge-node-${nodeItem.id}">
                                ${nodeItem.installed ? "Installato" : "Mancante"}
                            </div>
                        `;
                        nodesListEl.appendChild(row);
                    });

                    modulesListEl.innerHTML = "";
                    (systemData.modules || []).forEach(modItem => {
                        const row = document.createElement("div");
                        row.className = "wox-setup-item";
                        row.id = `item-module-${modItem.id}`;
                        row.innerHTML = `
                            <div class="wox-setup-item-info">
                                <div class="wox-setup-item-name">
                                    ${modItem.name}
                                    <span style="font-size: 10px; color: #64748b; font-weight: normal;">(${modItem.package})</span>
                                </div>
                                <div class="wox-setup-item-desc">${modItem.description}</div>
                            </div>
                            <div class="wox-setup-status-badge ${modItem.installed ? "installed" : "missing"}" id="badge-module-${modItem.id}">
                                ${modItem.installed ? "Installato" : "Mancante"}
                            </div>
                        `;
                        modulesListEl.appendChild(row);
                    });

                    modelsListEl.innerHTML = "";
                    (systemData.models || []).forEach(mdlItem => {
                        const row = document.createElement("div");
                        row.className = "wox-setup-item";
                        row.id = `item-model-${mdlItem.id}`;
                        row.innerHTML = `
                            <div class="wox-setup-item-info">
                                <div class="wox-setup-item-name">
                                    ${mdlItem.name}
                                    <span style="font-size: 10px; color: #64748b; font-weight: normal;">(${mdlItem.filename})</span>
                                </div>
                                <div class="wox-setup-item-desc">${mdlItem.description}</div>
                            </div>
                            <div class="wox-setup-status-badge ${mdlItem.installed ? "installed" : "missing"}" id="badge-model-${mdlItem.id}">
                                ${mdlItem.installed ? "Installato" : "Mancante"}
                            </div>
                        `;
                        modelsListEl.appendChild(row);
                    });
                };

                const refreshStatus = async () => {
                    try {
                        const res = await fetch("/wox_cinema/system_status");
                        if (res.ok) {
                            systemData = await res.json();
                            renderItems();
                            return;
                        }
                    } catch (err) {
                        console.warn("Fetch /wox_cinema/system_status failed, running client probe fallback...", err);
                    }

                    // Fallback reale: se ComfyUI non è stato ancora riavviato per registrare la nuova route backend,
                    // Fallback reale e dinamico: interroga direttamente le API native di ComfyUI (/models/ e /object_info)
                    // per verificare con assoluta precisione se i file esistono realmente sul disco!
                    try {
                        let knownNodes = {};
                        try {
                            const objRes = await fetch("/object_info");
                            if (objRes.ok) {
                                knownNodes = await objRes.json();
                            }
                        } catch (e) {}

                        const nodeKeys = Object.keys(knownNodes);
                        const hasVHS = nodeKeys.some(k => k.startsWith("VHS_") || k.includes("VideoCombine"));
                        const hasKJ = nodeKeys.some(k => k.includes("ResolutionSelector") || k.includes("ColorToMask"));
                        const hasLucy = nodeKeys.some(k => k.includes("Lucy") || k.includes("WOXCinema"));

                        // Recupera l'elenco reale e aggiornato dei file fisicamente presenti in ogni sottocartella di models
                        const fetchModelCategoryList = async (cat) => {
                            try {
                                const r = await fetch(`/models/${cat}`);
                                if (r.ok) {
                                    const list = await r.json();
                                    return Array.isArray(list) ? list.map(x => String(x).toLowerCase()) : [];
                                }
                            } catch (e) {}
                            return [];
                        };

                        const [unetFiles, clipFiles, vaeFiles, loraFiles] = await Promise.all([
                            fetchModelCategoryList("diffusion_models"),
                            fetchModelCategoryList("text_encoders"),
                            fetchModelCategoryList("vae"),
                            fetchModelCategoryList("loras")
                        ]);

                        const isModelInstalled = (fileList, filename, aliases = []) => {
                            const fnLower = filename.toLowerCase();
                            const checkList = [fnLower, ...aliases.map(a => a.toLowerCase())];
                            return fileList.some(f => {
                                const base = f.split("/").pop().split("\\").pop().toLowerCase();
                                // Se il file è disabilitato con prefisso '_' o '.disabled', NON è installato!
                                if (base.startsWith("_") || base.startsWith(".")) return false;
                                return checkList.includes(base) || checkList.some(c => base === c);
                            });
                        };

                        systemData = {
                            success: true,
                            nodes: [
                                {
                                    id: "ComfyUI-VideoHelperSuite",
                                    name: "ComfyUI-VideoHelperSuite",
                                    description: "Elaborazione e salvataggio video/audio (CreateVideo, SaveVideo, VHS)",
                                    repo: "https://github.com/Kosinkadink/ComfyUI-VideoHelperSuite",
                                    folder: "ComfyUI-VideoHelperSuite",
                                    installed: hasVHS
                                },
                                {
                                    id: "ComfyUI-KJNodes",
                                    name: "ComfyUI-KJNodes",
                                    description: "Selettore di risoluzione e utility cinematografiche (ResolutionSelector)",
                                    repo: "https://github.com/kijai/ComfyUI-KJNodes",
                                    folder: "ComfyUI-KJNodes",
                                    installed: hasKJ
                                },
                                {
                                    id: "ComfyUI-Manager",
                                    name: "ComfyUI-Manager",
                                    description: "Gestore globale di estensioni e modelli per ComfyUI",
                                    repo: "https://github.com/ltdrdata/ComfyUI-Manager",
                                    folder: "ComfyUI-Manager",
                                    installed: true
                                }
                            ],
                            modules: [
                                { id: "requests", name: "requests", package: "requests", description: "Comunicazione HTTP e API client REST", installed: true },
                                { id: "aiohttp", name: "aiohttp", package: "aiohttp", description: "Server asincrono e WebSocket integrati", installed: true },
                                { id: "imageio", name: "imageio", package: "imageio", description: "Caricamento e manipolazione frame grafici", installed: true },
                                { id: "imageio-ffmpeg", name: "imageio-ffmpeg", package: "imageio-ffmpeg", description: "Codec e compressione video MP4/H.264", installed: true },
                                { id: "pillow", name: "Pillow (PIL)", package: "Pillow", description: "Elaborazione immagini ad alte prestazioni", installed: true }
                            ],
                            models: [
                                {
                                    id: "z-image-turbo",
                                    name: "Z-Image Turbo UNET (FP8)",
                                    filename: "z-image-turbo-fp8-e4m3fn.safetensors",
                                    folder: "diffusion_models",
                                    description: "UNET neurale per la generazione di immagini ad altissima velocità (Z-Image Turbo)",
                                    url: "https://huggingface.co/Andyhere/Z-images_models/resolve/main/z-image-turbo-fp8-e4m3fn.safetensors",
                                    installed: isModelInstalled(unetFiles, "z-image-turbo-fp8-e4m3fn.safetensors", ["z_image_turbo_int8_convrot.safetensors"])
                                },
                                {
                                    id: "qwen_image_edit",
                                    name: "Qwen Image Edit UNET (FP8)",
                                    filename: "qwen_image_edit_fp8_e4m3fn.safetensors",
                                    folder: "diffusion_models",
                                    description: "UNET per l'editing contestuale e modifica selettiva delle immagini",
                                    url: "https://huggingface.co/Comfy-Org/Qwen-Image-Edit_ComfyUI/resolve/main/split_files/diffusion_models/qwen_image_edit_fp8_e4m3fn.safetensors",
                                    installed: isModelInstalled(unetFiles, "qwen_image_edit_fp8_e4m3fn.safetensors")
                                },
                                {
                                    id: "minimax_h3_fl2va",
                                    name: "MiniMax H3 First-Last to Video UNET (INT8)",
                                    filename: "minimax_h3_fl2va_pruned_int8_convrot.safetensors",
                                    folder: "diffusion_models",
                                    description: "UNET cinematografico MiniMax H3 per generazione video da prompt e frame iniziale (Load Diffusion Model)",
                                    url: "https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/diffusion_models/minimax_h3_fl2va_pruned_int8_convrot.safetensors",
                                    installed: isModelInstalled(unetFiles, "minimax_h3_fl2va_pruned_int8_convrot.safetensors")
                                },
                                {
                                    id: "minimax_h3_ref2va",
                                    name: "MiniMax H3 Ref to Video UNET (INT8)",
                                    filename: "minimax_h3_ref2va_pruned_int8_convrot.safetensors",
                                    folder: "diffusion_models",
                                    description: "UNET cinematografico MiniMax H3 con supporto reference images (Load Diffusion Model)",
                                    url: "https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/diffusion_models/minimax_h3_ref2va_pruned_int8_convrot.safetensors",
                                    installed: isModelInstalled(unetFiles, "minimax_h3_ref2va_pruned_int8_convrot.safetensors")
                                },
                                {
                                    id: "qwen_3_4b",
                                    name: "Qwen 3 4B Text Encoder (Lumina 2)",
                                    filename: "qwen_3_4b.safetensors",
                                    folder: "text_encoders",
                                    description: "Text Encoder per Z-Image Turbo per interpretazione cinematografica",
                                    url: "https://huggingface.co/Andyhere/Z-images_models/resolve/main/qwen_3_4b.safetensors",
                                    installed: isModelInstalled(clipFiles, "qwen_3_4b.safetensors", ["qwen_3_4b_fp8_mixed.safetensors"])
                                },
                                {
                                    id: "qwen_2_5_vl_7b",
                                    name: "Qwen 2.5 VL 7B Text/Vision Encoder",
                                    filename: "qwen_2.5_vl_7b_fp8_scaled.safetensors",
                                    folder: "text_encoders",
                                    description: "Vision Language Text Encoder per Image Editing con Qwen",
                                    url: "https://huggingface.co/Comfy-Org/Qwen-Image_ComfyUI/resolve/main/split_files/text_encoders/qwen_2.5_vl_7b_fp8_scaled.safetensors",
                                    installed: isModelInstalled(clipFiles, "qwen_2.5_vl_7b_fp8_scaled.safetensors")
                                },
                                {
                                    id: "qwen3vl_32b_minimax_h3",
                                    name: "MiniMax H3 Text/Vision CLIP (Qwen3-VL 32B NVFP4)",
                                    filename: "qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors",
                                    folder: "text_encoders",
                                    description: "Text/Vision Encoder avanzato per MiniMax H3 Cinema Video (Load CLIP)",
                                    url: "https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/text_encoders/qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors",
                                    installed: isModelInstalled(clipFiles, "qwen3vl_32b_minimax_h3_nvfp4_awq.safetensors")
                                },
                                {
                                    id: "ae_vae",
                                    name: "AE VAE Decoder (Flux / Z-Image)",
                                    filename: "ae.safetensors",
                                    folder: "vae",
                                    description: "Autoencoder latente a 16 canali per rendering nitido ad alta risoluzione",
                                    url: "https://huggingface.co/camenduru/FLUX.1-dev/resolve/main/ae.safetensors",
                                    installed: isModelInstalled(vaeFiles, "ae.safetensors")
                                },
                                {
                                    id: "qwen_image_vae",
                                    name: "Qwen Image VAE Decoder",
                                    filename: "qwen_image_vae.safetensors",
                                    folder: "vae",
                                    description: "Autoencoder latente dedicato al pipeline di Qwen Image Edit",
                                    url: "https://huggingface.co/Comfy-Org/Qwen-Image_ComfyUI/resolve/main/split_files/vae/qwen_image_vae.safetensors",
                                    installed: isModelInstalled(vaeFiles, "qwen_image_vae.safetensors")
                                },
                                {
                                    id: "minimax_h3_video_vae",
                                    name: "MiniMax H3 Video VAE (FP16)",
                                    filename: "minimax_h3_video_vae_fp16.safetensors",
                                    folder: "vae",
                                    description: "Decoder video ad alta definizione spaziotemporale (Video VAE)",
                                    url: "https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/vae/minimax_h3_video_vae_fp16.safetensors",
                                    installed: isModelInstalled(vaeFiles, "minimax_h3_video_vae_fp16.safetensors")
                                },
                                {
                                    id: "minimax_h3_audio_vae",
                                    name: "MiniMax H3 Audio VAE (FP32)",
                                    filename: "minimax_h3_audio_vae_fp32.safetensors",
                                    folder: "vae",
                                    description: "Autoencoder per la sintesi e decodifica dell'audio integrato (Audio VAE)",
                                    url: "https://huggingface.co/Comfy-Org/MiniMax-H3/resolve/main/vae/minimax_h3_audio_vae_fp32.safetensors",
                                    installed: isModelInstalled(vaeFiles, "minimax_h3_audio_vae_fp32.safetensors")
                                },
                                {
                                    id: "qwen_edit_lightning",
                                    name: "Qwen Image Edit Lightning 4-Steps LoRA",
                                    filename: "Qwen-Image-Edit-Lightning-4steps-V1.0-bf16.safetensors",
                                    folder: "loras",
                                    description: "Acceleratore a 4 passi di inferenza per generazione istantanea",
                                    url: "https://huggingface.co/lightx2v/Qwen-Image-Lightning/resolve/main/Qwen-Image-Edit-Lightning-4steps-V1.0-bf16.safetensors",
                                    installed: isModelInstalled(loraFiles, "Qwen-Image-Edit-Lightning-4steps-V1.0-bf16.safetensors")
                                }
                            ]
                        };
                        renderItems();
                    } catch (err) {
                        console.error("Errore fallback refreshStatus:", err);
                    }
                };

                await refreshStatus();

                installBtn.addEventListener("click", async () => {
                    if (!systemData) return;
                    installBtn.disabled = true;
                    progressBox.classList.add("active");

                    const itemsToInstall = [];
                    (systemData.modules || []).forEach(m => {
                        if (!m.installed) {
                            itemsToInstall.push({
                                type: "module",
                                id: m.id,
                                name: m.name,
                                target: m.package
                            });
                        }
                    });
                    (systemData.nodes || []).forEach(n => {
                        if (!n.installed) {
                            itemsToInstall.push({
                                type: "node",
                                id: n.id,
                                name: n.name,
                                target: n.repo,
                                folder: n.folder
                            });
                        }
                    });
                    (systemData.models || []).forEach(mdl => {
                        if (!mdl.installed) {
                            itemsToInstall.push({
                                type: "model",
                                id: mdl.id,
                                name: mdl.name,
                                target: mdl.url,
                                folder: mdl.folder,
                                filename: mdl.filename
                            });
                        }
                    });

                    if (itemsToInstall.length === 0) {
                        globalBar.style.width = "100%";
                        globalPercent.innerText = "100%";
                        globalStatus.innerText = "Tutti i nodi, moduli e modelli sono già installati!";
                        itemBar.style.width = "100%";
                        itemPercent.innerText = "100%";
                        itemStatus.innerText = "Nessun download in sospeso.";
                        logLine.innerText = "Tutti i componenti necessari sono già presenti sul disco.";
                        if (speedTag) speedTag.style.display = "none";
                        installBtn.disabled = false;
                        return;
                    }

                    const total = itemsToInstall.length;
                    for (let i = 0; i < total; i++) {
                        const itm = itemsToInstall[i];
                        const globalPct = Math.round((i / total) * 100);
                        globalBar.style.width = `${globalPct}%`;
                        globalPercent.innerText = `${globalPct}%`;
                        globalStatus.innerText = `Avanzamento Globale: elemento ${i + 1} di ${total}`;

                        itemBar.style.width = "0%";
                        itemPercent.innerText = "0%";
                        itemStatus.innerText = itm.name;
                        const badgeMap = { model: "MODELLO", node: "NODO", module: "MODULO" };
                        itemBadge.innerText = badgeMap[itm.type] || (itm.type || "ELEMENTO").toUpperCase();
                        logLine.innerText = `Preparazione download / installazione di ${itm.name}...`;
                        if (speedTag) speedTag.style.display = "none";

                        const itemRow = modal.querySelector(`#item-${itm.type}-${itm.id}`);
                        const itemBadgeEl = modal.querySelector(`#badge-${itm.type}-${itm.id}`);
                        if (itemRow) itemRow.classList.add("item-active-download");
                        if (itemBadgeEl) {
                            itemBadgeEl.className = "wox-setup-status-badge downloading";
                            itemBadgeEl.innerText = "Scaricamento...";
                        }

                        try {
                            const res = await fetch("/wox_cinema/install_items", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify(itm)
                            });
                            const result = await res.json();
                            if (result.success) {
                                itemBar.style.width = "100%";
                                itemPercent.innerText = "100%";
                                if (itemBadgeEl) {
                                    itemBadgeEl.className = "wox-setup-status-badge installed";
                                    itemBadgeEl.innerText = "Installato";
                                }
                            } else {
                                if (itemBadgeEl) {
                                    itemBadgeEl.className = "wox-setup-status-badge missing";
                                    itemBadgeEl.innerText = "Errore";
                                    itemBadgeEl.title = result.error || "Errore installazione";
                                }
                                logLine.innerText = `Errore per ${itm.name}: ${result.error || "Errore"}`;
                            }
                        } catch (e) {
                            if (itemBadgeEl) {
                                itemBadgeEl.className = "wox-setup-status-badge missing";
                                itemBadgeEl.innerText = "Errore";
                            }
                            logLine.innerText = `Eccezione di rete su ${itm.name}: ${e.message}`;
                        } finally {
                            if (itemRow) itemRow.classList.remove("item-active-download");
                        }
                    }

                    globalBar.style.width = "100%";
                    globalPercent.innerText = "100%";
                    globalStatus.innerText = `Completato: tutti i ${total} elementi processati!`;
                    itemBar.style.width = "100%";
                    itemPercent.innerText = "100%";
                    itemStatus.innerText = "Tutti gli elementi sono pronti.";
                    if (speedTag) speedTag.style.display = "none";
                    logLine.innerText = "Tutti i componenti e i modelli sono stati installati. Riavvia ComfyUI per attivare eventuali nuovi nodi o modelli.";
                    installBtn.disabled = false;
                    await refreshStatus();
                });
            };

            setTimeout(() => {
                syncFromWidgets();
            }, 100);

            return r;
        };
    }
});
