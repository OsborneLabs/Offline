// ==UserScript==
// @name         Offline for Lezhin
// @namespace    https://github.com/OsborneLabs
// @version      1.1.0
// @description  Downloads and saves Lezhin chapter images to a ZIP file for offline reading
// @author       Osborne Labs
// @license      GPL-3.0-only
// @homepageURL  https://github.com/OsborneLabs/Offline
// @icon         data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJMYXllcl8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDQ4IDQ4IiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA0OCA0ODsiIHhtbDpzcGFjZT0icHJlc2VydmUiPgogIDxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+CiAgICAuc3QwIHsKICAgICAgZmlsbDogI0VEMUMyNDsKICAgIH0KICAgIC5zdDEgewogICAgICBmaWxsOiAjRkZGRkZGOwogICAgfQogIDwvc3R5bGU+CiAgPGc+CiAgICA8Zz4KICAgICAgPHJlY3QgY2xhc3M9InN0MCIgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiAvPgogICAgPC9nPgogICAgPGc+CiAgICAgIDxwb2x5Z29uIGNsYXNzPSJzdDEiIHBvaW50cz0iMTIuNSwxMC42IDIxLjMsMTUuMyAzMC4zLDEwLjYgMzAuMywyNS45IDM3LjMsMjUuOSAzNy4zLDM3LjMgMTIuNSwzNy4zIAkJIiAvPgogICAgICA8cmVjdCB4PSIxNi41IiB5PSIyMyIgd2lkdGg9IjMiIGhlaWdodD0iMyIgLz4KICAgICAgPHJlY3QgeD0iMjMuNSIgeT0iMjMiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIC8+CiAgICAgIDxyZWN0IHg9IjM0LjMiIHk9IjI1LjkiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIC8+CiAgICAgIDxyZWN0IHg9IjMxLjgiIHk9IjMzIiB3aWR0aD0iNS42IiBoZWlnaHQ9IjEuMyIgLz4KICAgIDwvZz4KICA8L2c+Cjwvc3ZnPg==
// @match        https://*.lezhinus.com/*
// @match        https://*.lezhin.com/*
// @match        https://*.lezhin.es/*
// @match        https://*.lezhin.jp/*
// @match        https://*.lezhinde.com/*
// @match        https://*.lezhinfr.com/*
// @match        https://*.lezhinth.com/*
// @match        https://*.lezhinx.com/*
// @match        https://*.beltoon.jp/*
// @match        https://*.bomtoon.com/*
// @match        https://*.bomtoon.tw/*
// @match        https://*.boomtoon.com/*
// @run-at       document-start
// @connect      ccdn.lezhin.com
// @connect      rcdn.lezhin.com
// @supportURL   https://github.com/OsborneLabs/Offline/issues
// @require      https://cdn.jsdelivr.net/npm/fflate@0.8/umd/index.min.js
// @downloadURL  https://update.greasyfork.org/scripts/568060/Offline%20for%20Lezhin.user.js
// @updateURL    https://update.greasyfork.org/scripts/568060/Offline%20for%20Lezhin.meta.js
// @grant        GM_xmlhttpRequest
// ==/UserScript==

/* jshint esversion: 11 */
/* global fflate */

(() => {
    'use strict';

    const SCRIPT_NAME_DEBUG = "OFFLINE FOR LEZHIN";
    const SCRIPT_VERSION =
        typeof GM_info !== 'undefined' ?
        GM_info.script.version :
        'unknown';
    const UI_AUTO_REFRESH_FLAG = 'autoRefresh';
    const UI_TOAST_DURATION_MS = 8000;
    const UI_BUTTON_RESET_DELAY_MS = 3000;
    const UI_BUTTON_LABELS = {
        DEFAULT: 'Download',
        COLLECTING: c => c === 0 ? 'Starting...' : `Collecting: ${c}`,
        DOWNLOADING: (c, t) => `Downloading: ${c}/${t}`,
        CONVERTING: (c, t) => t && c >= t - 1 ? 'Finishing...' : c === 0 ? 'Converting...' : t ? `Converting: ${c}/${t}` : `Converting: ${c}`,
        COMPLETE: 'Complete!'
    };

    const VIEWER_ALTERNATE_DOMAINS = [
        'beltoon.jp', 'bomtoon.com', 'bomtoon.tw', 'lezhin.es', 'lezhinde.com', 'lezhinfr.com', 'lezhinth.com'
    ];

    const VIEWER_ROUTE_REGEX_JP =
        /^\/comic\/([^\/]+)\/chapter\/([^\/]+)\/viewer\/?$/;

    const RENDER_DETECTORS = {
        webp: {
            detect(wrapper) {
                if (wrapper.querySelector('canvas')) {
                    return false;
                }
                if (wrapper.querySelector("img[src^='blob:']")) {
                    return false;
                }
                const imgs = [...wrapper.querySelectorAll('img')]
                    .filter(img =>
                        img.src &&
                        !img.src.startsWith('blob:') &&
                        !isPromoImage(img)
                    );
                if (imgs.length < 5) {
                    return false;
                }
                return true;
            }
        },
        canvas: {
            detect(wrapper) {
                return !!wrapper.querySelector('canvas');
            }
        },
        blob: {
            detect(wrapper) {
                return [...wrapper.querySelectorAll('img')]
                    .some(img => img.src?.startsWith('blob:'));
            }
        }
    };

    const RENDER_PAGE_SELECTORS_HORIZONTAL = {
        horizontalWrapper: 'div[class^="pageView__cutWrap"]',
        horizontalNavNext: 'button[class*="nav--right"]'
    };

    const RENDER_PAGE_SELECTORS = [
        RENDER_PAGE_SELECTORS_HORIZONTAL.horizontalWrapper,
        'div[class^="ImageContainer__Container-"]',
        'div[class^="sc-"][width][height]',
        'div[class^="scrollViewCut__"]',
        'div[class^="VerticalViewer_page_container"]'
    ];

    const DOWNLOAD_ERROR_MAP = {
        BLOB_CAPTURE_FAILED: {
            code: 'blob-capture-failed',
            message: 'Failed to capture blob images'
        },
        DOWNLOAD_ABORTED: {
            code: 'download-aborted',
            message: 'Download error occurred'
        },
        IMAGE_COUNT_MISMATCH: {
            code: 'image-count-mismatch',
            message: 'Failed to collect all images'
        },
        JPEG_CONVERSION_FAILED: {
            code: 'jpeg-conversion-failed',
            message: 'Failed to convert JPEG images'
        },
        MOBILE_DEVICES_NOT_SUPPORTED: {
            code: 'mobile-devices-not-supported',
            message: 'Mobile devices are not supported'
        },
        NO_IMAGES_COLLECTED: {
            code: 'no-images-collected',
            message: 'No images were collected'
        },
        TOTAL_PAGE_COUNT_NOT_FOUND: {
            code: 'total-page-count-not-found',
            message: 'Could not find page count'
        },
        UNKNOWN_ERROR: {
            code: 'unknown-error',
            message: 'An unexpected error occurred'
        },
        VIEWER_CONTAINER_NOT_FOUND: {
            code: 'viewer-container-not-found',
            message: 'Could not find view container'
        },
        ZIP_CREATION_FAILED: {
            code: 'zip-creation-failed',
            message: 'Failed to create ZIP file'
        }
    };

    const DOWNLOAD_ERROR_INDEX = Object.fromEntries(
        Object.values(DOWNLOAD_ERROR_MAP).map(e => [e.code, e])
    );

    const IS_MOBILE_DEVICE = isMobileDevice();
    if (IS_MOBILE_DEVICE) {
        handleDownloadError(new Error(
            DOWNLOAD_ERROR_MAP.MOBILE_DEVICES_NOT_SUPPORTED.code
        ));
    }

    const state = {
        ui: {
            isDownloading: false,
            phase: 'idle',
            activeDownload: null,
            spaNavigated: false,
            images: new Map()
        },
        canvas: {
            enabled: false,
            lastDrawTs: 0,
            idleTimer: null,
            idleResolver: null,
            buffer: new Map(),
            pages: new Map()
        },
        blob: {
            enabled: false,
            buffer: new Map(),
            pages: new Map()
        },
        viewer: {
            detected: false,
            type: null,
            url: null,
            initialRenderingLogged: false,
            notFoundToastShown: false
        }
    };

    function createStyles() {
        const style = document.createElement('style');
        style.textContent = `
            :root {
                --color-app-button-default: #ED1C24;
                --color-app-button-hover: #C4161C;
                --color-app-button-disabled: #FF5254;
                --color-app-button-popup-default: #1F1F1F;
                --color-app-text-default: white;
                --size-text-body-default: 13px;
                --size-text-popup-default: 12px;
            }
            @keyframes toast-slide-in {
                from {
                    opacity: 0;
                    transform: translateY(-10px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }
            @keyframes toast-slide-out {
                from {
                    opacity: 1;
                    transform: translateY(0);
                }
                to {
                    opacity: 0;
                    transform: translateY(-10px);
                }
            }
            #lezhin-toast-container {
                display: flex;
                position: fixed;
                top: 20px;
                left: 50%;
                z-index: 9999;
                flex-direction: column;
                gap: 10px;
                transform: translateX(-50%);
                pointer-events: none;
            }
            .lezhin-toast {
                display: flex;
                align-items: center;
                justify-content: space-between;
                min-width: 260px;
                max-width: 360px;
                padding: 10px 14px;
                border-radius: 16px;
                font-size: 14px;
                color: white;
                background: var(--color-app-button-default);
                box-shadow: 0 2px 12px rgba(0,0,0,0.25);
                pointer-events: auto;
                user-select: none;
                animation: toast-slide-in 0.2s ease-out;
            }
            .lezhin-toast.closing {
                animation: toast-slide-out 0.2s ease-in forwards;
            }
            .lezhin-toast-close {
                position: relative;
                bottom: 1px;
                padding: 0;
                border: none;
                font-size: 20px;
                line-height: 1;
                color: white;
                background: none;
                cursor: pointer;
                user-select: auto;
            }
            .download-button {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                height: 28px;
                padding: 6px 10px;
                border: none;
                border-radius: 20px;
                z-index: 9998;
                font-size: var(--size-text-body-default);
                font-weight: 500;
                color: var(--color-app-text-default);
                background: var(--color-app-button-default);
                cursor: pointer;
                user-select: none;
                transition: background-color 0.20s ease;
            }
            .download-button-custom {
                position: relative;
                bottom: 1px;
                margin-left: 15px;
            }
            .download-button-default {
                position: fixed;
                top: 3.5%;
                left: 50%;
                transform: translate(-50%, -50%);
            }
            .download-button:hover:not(:disabled) {
                background: var(--color-app-button-hover);
            }
            .download-button:disabled {
                background: var(--color-app-button-disabled);
                cursor: not-allowed;
            }
            .download-wrapper {
                display: inline-block;
                position: relative;
            }
            .download-popup {
                position: fixed;
                z-index: 9998;
                transform: translateX(-50%);
                min-width: 150px;
                padding: 12px;
                border-radius: 16px;
                font-size: var(--size-text-popup-default);
                color: white;
                background: var(--color-app-button-popup-default);
                box-shadow: 0 2px 12px rgba(0,0,0,0.25);
                opacity: 0;
                visibility: hidden;
                pointer-events: none;
                user-select: none;
                transition: opacity 0.20s ease, visibility 0.20s ease;
            }
            .download-popup.visible {
                opacity: 1;
                visibility: visible;
                pointer-events: auto;
            }
            .download-popup-version {
                margin-bottom: 10px;
            }
            body.lock-site-ui * {
                pointer-events: none !important;
                user-select: none !important;
            }
            body.lock-site-ui .download-button {
                pointer-events: auto !important;
            }
        `;
        document.head.appendChild(style);
    }

    function init() {
        sessionStorage.removeItem(UI_AUTO_REFRESH_FLAG);
        createStyles();
        observeURLMutation();
        initDownloadButtonObserver();
        initCanvasDrawHook();
        initBlobBackgroundCollector();
        createDownloadButton();
    }

    function observeURLMutation() {
        let previousPath = location.pathname;
        let headerObserver = null;
        let initObserver = null;
        const onRealNavigation = () => {
            if (location.pathname === previousPath) return;
            const wasChapterPage = isChapterPage(previousPath);
            const isChapterNow = isChapterPage();
            previousPath = location.pathname;
            console.clear();
            if (wasChapterPage && !isChapterNow) {
                removeDownloadButton();
            }
            normalizeChapterNavigation();
            resetChapterState();
            if (isChapterNow) {
                onChapterEnter();
            }
        };
        const resetChapterState = () => {
            abortDownloadSession();
            state.ui.images.clear();
            state.viewer.detected = false;
            state.viewer.type = null;
            state.viewer.url = null;
            state.viewer.notFoundToastShown = false;
            if (headerObserver) {
                headerObserver.disconnect();
                headerObserver = null;
            }
            if (initObserver) {
                initObserver.disconnect();
                initObserver = null;
            }
        };
        const onChapterEnter = () => {
            let initialized = false;
            const relocateButtonToHeader = () => {
                const header = getViewerHeaderContainer();
                if (!header) return;
                const btn = document.querySelector('.download-button');
                if (!btn) return;
                if (btn.parentElement !== header) {
                    btn.classList.remove('download-button-default');
                    btn.classList.add('download-button-custom');
                    header.appendChild(btn);
                }
            };
            const tryInit = () => {
                if (initialized) return;
                const viewer = getViewerContainer();
                if (!viewer) return;
                initialized = true;
                if (initObserver) {
                    initObserver.disconnect();
                    initObserver = null;
                }
                createDownloadButton();
                detectRenderType();
                relocateButtonToHeader();
                setSinglePageLayout();
            };
            initObserver = new MutationObserver(tryInit);
            initObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
            headerObserver = new MutationObserver(relocateButtonToHeader);
            headerObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
            tryInit();
        };
        window.addEventListener('popstate', onRealNavigation);
        window.addEventListener('hashchange', onRealNavigation);
        const hookHistory = type => {
            const original = history[type];
            history[type] = function(...args) {
                const ret = original.apply(this, args);
                onRealNavigation();
                return ret;
            };
        };
        hookHistory('pushState');
        hookHistory('replaceState');
        if (isChapterPage()) {
            normalizeChapterNavigation();
            onChapterEnter();
        }
    }

    function normalizeChapterNavigation() {
        if (!isChapterPage()) return;
        if (sessionStorage.getItem('lezhin-hard-loaded')) {
            sessionStorage.removeItem('lezhin-hard-loaded');
            state.ui.spaNavigated = false;
            return;
        }
        if (state.ui.spaNavigated) {
            sessionStorage.setItem('lezhin-hard-loaded', '1');
            location.reload();
        }
    }

    function isChapterPage(url = location.pathname) {
        const usesStringChapterId =
            isAlternateViewerLayout() ||
            /(^|\.)lezhinx\.com$/.test(location.hostname);
        let viewerRegex;
        if (usesStringChapterId) {
            viewerRegex = /^\/viewer\/[^\/]+\/[^\/]+\/?$/;
        } else {
            viewerRegex = /^\/viewer\/[^\/]+\/\d+\/?$/;
        }
        return (
            /^\/(?:[a-z]{2}\/)?comic\/[^\/]+\/[^\/]+\/?$/.test(url) ||
            /^\/comic\/[^\/]+\/chapter\/[^\/]+\/viewer\/?$/.test(url) ||
            viewerRegex.test(url)
        );
    }

    function isAlternateViewerLayout() {
        const host = location.hostname;
        return VIEWER_ALTERNATE_DOMAINS.some(d => host.endsWith(d));
    }

    function isHorizontalViewerLayout() {
        const {
            horizontalWrapper,
            horizontalNavNext
        } = RENDER_PAGE_SELECTORS_HORIZONTAL;
        return !!document.querySelector(horizontalWrapper) &&
            !!document.querySelector(horizontalNavNext);
    }

    function getViewerLayoutConfig() {
        const host = location.hostname;
        const isAlternate = isAlternateViewerLayout();
        const isLezhinx = host.endsWith('lezhinx.com');
        const useCutsAsSource =
            isAlternate || isLezhinx;
        const cuts = useCutsAsSource ?
            getIndexedComicCuts({
                ensureIndex: true
            }) :
            null;
        return {
            type: useCutsAsSource ? 'cut-based' : 'standard',
            pageSource: useCutsAsSource ? 'cuts' : 'dom',
            cuts,
            scroll: {
                preventLastScroll: isLezhinx,
                offset: isLezhinx ? 500 : 0
            }
        };
    }

    function isMobileDevice() {
        const userAgentCheck = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const smallViewport = window.matchMedia('(max-width: 768px)').matches;
        const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
        return userAgentCheck || (hasTouch && (smallViewport || coarsePointer));
    }

    function detectRenderType() {
        if (!isChapterPage()) return null;
        if (state.viewer.detected && state.viewer.url === location.pathname) {
            return state.viewer.type;
        }
        const wrapper = getViewerContainer();
        if (!wrapper) {
            if (
                !state.viewer.notFoundToastShown &&
                document.readyState === 'complete'
            ) {
                state.viewer.notFoundToastShown = true;
                setTimeout(() => {
                    if (!getViewerContainer()) {
                        handleDownloadError(
                            new Error(DOWNLOAD_ERROR_MAP.VIEWER_CONTAINER_NOT_FOUND.code)
                        );
                    } else {
                        state.viewer.notFoundToastShown = false;
                    }
                }, 800);
            }
            return null;
        }
        const priority = ['canvas', 'blob', 'webp'];
        const tryDetect = () => {
            for (const type of priority) {
                const renderer = RENDER_DETECTORS[type];
                if (renderer?.detect(wrapper)) {
                    setRenderType(type);
                    return true;
                }
            }
            return false;
        };
        if (tryDetect()) return state.viewer.type;
        const observer = new MutationObserver(() => {
            if (tryDetect()) observer.disconnect();
        });
        observer.observe(wrapper, {
            childList: true,
            subtree: true
        });
        return null;
    }

    function resolveRenderType() {
        const wrapper = getViewerContainer();
        if (!wrapper) return state.viewer.type;
        if (wrapper.querySelector('canvas')) {
            setRenderType('canvas');
            return 'canvas';
        }
        if (wrapper.querySelector("img[src^='blob:']")) {
            setRenderType('blob');
            return 'blob';
        }
        setRenderType('webp');
        return 'webp';
    }

    function setRenderType(type) {
        if (!state.viewer.initialRenderingLogged) {
            state.viewer.initialRenderingLogged = true;
            const wrapper = getViewerContainer();
            console.log(
                `${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION} - INITIAL RENDERING METHOD: %c${type.toUpperCase()}`,
                'font-weight:bold;', {
                    images: wrapper ? wrapper.querySelectorAll('img').length : 0,
                    blobImages: wrapper ? wrapper.querySelectorAll("img[src^='blob:']").length : 0,
                    canvases: wrapper ? wrapper.querySelectorAll('canvas').length : 0
                }
            );
        }
        state.viewer.type = type;
        state.viewer.detected = true;
        state.viewer.url = location.pathname;
    }

    function getViewerContainer() {
        const containers = [
            '[class^="CoreViewer_viewer_wrapper__"]',
            'div[class^="ImageContainer__Container"]',
            'div[class^="pageView__"]',
            'div[class^="sc-"]',
            'div[class^="scrollViewWrapper__"]',
        ];
        for (const selector of containers) {
            const el = document.querySelector(selector);
            if (el) return el;
        }
        return null;
    }

    function getViewerScroller() {
        return (
            document.querySelector('.no-scrollbar-viewer') ||
            document.scrollingElement ||
            document.documentElement
        );
    }

    function getViewerHeaderContainer() {
        const viewerHeader = document.querySelector('#viewer-header');
        if (!viewerHeader) return null;
        const title = viewerHeader.querySelector('span[class^="vh__title__"]');
        if (!title) return null;
        return title.parentElement;
    }

    function applyViewerHeaderOverride() {
        const viewerHeader = document.getElementById('viewer-header');
        if (!viewerHeader) return null;
        const existing = document.getElementById('download-header-override');
        if (existing) return existing;
        const style = document.createElement('style');
        style.id = 'download-header-override';
        style.textContent = `
            #viewer-header {
                transform: none !important;
                opacity: 1 !important;
            }
        `;
        document.head.appendChild(style);
        return style;
    }

    function getIndexedComicCuts({
        ensureIndex = true
    } = {}) {
        for (const selector of RENDER_PAGE_SELECTORS) {
            const cuts = [...document.querySelectorAll(selector)];
            if (!cuts.length) continue;
            if (ensureIndex) {
                let index = 1;
                for (const cut of cuts) {
                    if (!cut.dataset.cutIndex) {
                        cut.dataset.cutIndex = String(index);
                    }
                    index++;
                }
            }
            return cuts;
        }
        return [];
    }

    function getVisiblePageIndex(canvas) {
        const canvasRect = canvas.getBoundingClientRect();
        const canvasMidY = canvasRect.top + canvasRect.height / 2;
        const special = getViewerLayoutConfig();
        const cutsToUse = special.enabled ?
            special.safeCuts :
            getIndexedComicCuts();
        for (const cut of cutsToUse) {
            const rect = cut.getBoundingClientRect();
            if (canvasMidY >= rect.top && canvasMidY <= rect.bottom) {
                const index = Number(cut.dataset.cutIndex);
                return Number.isFinite(index) ? index : null;
            }
        }
        return null;
    }

    function getAllPageIndexes() {
        return getIndexedComicCuts()
            .map(c => Number(c.dataset.cutIndex))
            .filter(Number.isFinite);
    }

    function getTotalPageCount() {
        const layout = getViewerLayoutConfig();
        if (layout.pageSource === 'cuts') {
            if (layout.cuts && layout.cuts.length) {
                return layout.cuts.length;
            }
        }
        const sources = [
            () => {
                const slider = document.querySelector(
                    'input[type="range"][max]'
                );
                if (!slider) return null;
                const max = Number(slider.max);
                return Number.isFinite(max) ? max + 1 : null;
            },
            () => {
                const slider = document.querySelector(
                    '[class^="lzSlider__"] button[data-max]'
                );
                const max = slider && Number(slider.dataset.max);
                return Number.isFinite(max) ? max : null;
            },
            () => {
                const footer = document.querySelector(
                    'div[class^="Footer_footerContainer__"]'
                );
                const match = footer?.textContent?.match(/\/\s*(\d+)/);
                const max = match && Number(match[1]);
                return Number.isFinite(max) ? max : null;
            }
        ];
        for (const getMax of sources) {
            const max = getMax();
            if (max) return max;
        }
        throwDownloadError('TOTAL_PAGE_COUNT_NOT_FOUND');
    }

    function isPromoImage(img) {
        if (!(img instanceof HTMLImageElement) || !img.src) return true;
        const PROMO_IMAGE_URL_BLOCKLIST = [
            'cover', 'banner', 'notice_contents', 'promotion'
        ];
        const PROMO_IMAGE_CLASS_BLOCKLIST = [
            'promotion', 'thumbnail'
        ];
        try {
            if (PROMO_IMAGE_URL_BLOCKLIST.some(p => img.src.includes(p))) {
                return true;
            }
            if (PROMO_IMAGE_CLASS_BLOCKLIST.some(p =>
                    img.closest(`[class*="${p}"]`)
                )) {
                return true;
            }
            return false;
        } catch {
            return true;
        }
    }

    function scrollToComicPage(index, {
        instant = false,
        allowLastPage = false
    } = {}) {
        const cuts = getIndexedComicCuts();
        if (!cuts.length) return false;
        if (!Number.isFinite(index)) {
            index = Number(cuts[0]?.dataset.cutIndex);
        }
        const targetCut = cuts.find(c =>
            Number(c.dataset.cutIndex) === index
        );
        if (!targetCut) return false;
        const domainBehavior = getViewerLayoutConfig();
        let scrollTarget = targetCut.offsetTop;
        const lastCut = cuts.at(-1);
        const lastIndex = Number(lastCut?.dataset.cutIndex);
        if (
            domainBehavior.active &&
            domainBehavior.preventLastScroll &&
            !allowLastPage &&
            index === lastIndex
        ) {
            scrollTarget = Math.max(
                0,
                targetCut.offsetTop - domainBehavior.scrollOffset
            );
        }
        const scroller = getViewerScroller();
        const behavior = instant ? 'auto' : 'smooth';
        if (scroller && scroller !== document.body) {
            scroller.scrollTo({
                top: scrollTarget,
                behavior
            });
        } else {
            window.scrollTo({
                top: scrollTarget,
                behavior
            });
        }
        return true;
    }

    function scrollToTop() {
        const scroller = getViewerScroller();
        if (!scroller) return;
        scroller.scrollTop = 0;
        scroller.dispatchEvent(new Event('scroll'));
    }

    async function setSinglePageLayout() {
        try {
            const SINGLE_LAYOUT_DOMAINS = [
                /\.?lezhin\.com$/,
            ];
            const SINGLE_LAYOUT_LABELS = [
                '두 쪽 보기',
            ];
            const shouldApply = SINGLE_LAYOUT_DOMAINS.some(regex =>
                regex.test(location.hostname)
            );
            if (!shouldApply) return;
            if (!document.querySelector(RENDER_PAGE_SELECTORS_HORIZONTAL.horizontalWrapper)) {
                return;
            }
            const wait = ms => new Promise(r => setTimeout(r, ms));
            const waitFor = (fn, timeout = 4000) => {
                return new Promise(resolve => {
                    const existing = fn();
                    if (existing) return resolve(existing);
                    const observer = new MutationObserver(() => {
                        const el = fn();
                        if (el) {
                            observer.disconnect();
                            resolve(el);
                        }
                    });
                    observer.observe(document.body, {
                        childList: true,
                        subtree: true
                    });
                    setTimeout(() => {
                        observer.disconnect();
                        resolve(null);
                    }, timeout);
                });
            };
            const gearButton = document.querySelector(
                'button[class*="viewerToolbar__iconButton"]'
            );
            if (!gearButton) return;
            gearButton.click();
            const modal = await waitFor(() =>
                document.querySelector('.lzModalContainer')
            );
            if (!modal) return;
            await wait(150);
            const rows = [...modal.querySelectorAll('div.flex')];
            const targetRow = rows.find(row => {
                const p = row.querySelector('p');
                if (!p) return false;
                const text = p.textContent.trim();
                return SINGLE_LAYOUT_LABELS.includes(text);
            });
            if (!targetRow) {
                modal.querySelector('button[class*="absolute"]')?.click();
                return;
            }
            const switchEl = targetRow.querySelector('.lzSwitch');
            if (!switchEl) return;
            const currentState = switchEl.getAttribute('data-switch');
            if (currentState === 'off') {
                modal.querySelector('button[class*="absolute"]')?.click();
                return;
            }
            switchEl.dispatchEvent(
                new MouseEvent('click', {
                    bubbles: true,
                    cancelable: true
                })
            );
            await wait(300);
            modal.querySelector('button[class*="absolute"]')?.click();
        } catch (e) {
            console.debug(`${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION}: ERROR SETTING SINGLE PAGE LAYOUT\n`, e);
        }
    }

    function getSeriesTitle() {
        const hostname = location.hostname;
        const ogTitle = document
            .querySelector('meta[property="og:title"]')
            ?.getAttribute('content')
            ?.trim();
        const pageTitle = document.title?.trim();

        function formatTitle(input) {
            if (!input) return null;
            return sanitizeFileNamePart(input.trim());
        }
        if (hostname.endsWith('lezhin.com') && ogTitle) {
            const parts = ogTitle.split(' - ').map(p => p.trim());
            if (parts.length >= 1) {
                return formatTitle(parts[0]);
            }
        }
        if (hostname.endsWith('lezhinus.com') && ogTitle) {
            const parts = ogTitle.split(' - ').map(p => p.trim());
            if (parts.length >= 3) return formatTitle(parts[0]);
        }
        if (hostname.endsWith('beltoon.jp') && ogTitle) {
            const match = ogTitle.match(/^(.*?)\s*-\s*.*?\s*-\s*BeLTOON/i);
            if (match) return formatTitle(match[1]);
        }
        if (hostname.endsWith('bomtoon.com') && ogTitle) {
            const match = ogTitle.match(/^(.*?)\s*-\s*.*?\s*-\s*봄툰$/i);
            if (match) return formatTitle(match[1]);
        }
        if (hostname.endsWith('bomtoon.tw') && ogTitle) {
            const match = ogTitle.match(/^(.*?)\s*-\s*.*?\s*-\s*BOMTOON/i);
            if (match) return formatTitle(match[1]);
        }
        if (hostname.endsWith('lezhin.es') && ogTitle) {
            const match = ogTitle.match(/^(.*?)\s*-\s*(.*?)$/);
            if (match) return formatTitle(match[1]);
        }
        if (hostname.endsWith('lezhin.jp')) {
            const match = location.pathname.match(VIEWER_ROUTE_REGEX_JP);
            if (match) {
                const seriesSlug = match[1];
                return formatTitle(seriesSlug);
            }
        }
        if (hostname.endsWith('lezhinde.com') && ogTitle) {
            const match = ogTitle.match(/^(.*?)\s*-\s*.*?\s*-\s*Lezhin/i);
            if (match) return formatTitle(match[1]);
        }
        if (hostname.endsWith('lezhinfr.com') && pageTitle) {
            const match = pageTitle.match(/^(.*?)\s*-\s*(.*?)\s*-/);
            if (match) return formatTitle(match[1]);
        }
        if (hostname.endsWith('lezhinth.com') && ogTitle) {
            const match = ogTitle.match(/^(.*?)\s*-\s*.*?\s*-\s*LEZHIN\s*TH$/i);
            if (match) return formatTitle(match[1]);
        }
        if (hostname.endsWith('lezhinx.com') && ogTitle) {
            const match = ogTitle.match(/^(.*?)\s*-\s*(.*?)\s*-\s*Lezhin\s*X$/i);
            if (match) return formatTitle(match[1]);
        }
        return 'Unknown Series';
    }

    function getSeriesChapter() {
        const hostname = location.hostname;
        const ogTitle = document
            .querySelector('meta[property="og:title"]')
            ?.getAttribute('content')
            ?.trim();
        const pageTitle = document.title?.trim();

        function formatChapter(input) {
            if (!input) return null;
            const cleaned = input.trim();
            const numberMatch = cleaned.match(/\d+/);
            if (numberMatch) {
                return numberMatch[0].padStart(2, '0');
            }
            return sanitizeFileNamePart(cleaned);
        }
        if (hostname.endsWith('lezhin.com') && ogTitle) {
            return formatChapter(ogTitle.split(' - ')[1]?.replace(/화$/, ''));
        }
        if (hostname.endsWith('lezhinus.com') && ogTitle) {
            const parts = ogTitle.split(' - ').map(p => p.trim());
            if (parts.length >= 3) {
                return formatChapter(parts[1] || parts[2]);
            }
        }
        if (hostname.endsWith('beltoon.jp') && ogTitle) {
            const match = ogTitle.match(/^\s*.*?\s*-\s*(.*?)\s*-\s*BeLTOON/i);
            if (match) return formatChapter(match[1]);
        }
        if (hostname.endsWith('bomtoon.com') && ogTitle) {
            const match = ogTitle.match(/^\s*.*?\s*-\s*(.*?)\s*-\s*봄툰$/i);
            if (match) {
                const chapterTitle = match[1].replace(/화$/, '');
                return formatChapter(chapterTitle);
            }
        }
        if (hostname.endsWith('bomtoon.tw') && ogTitle) {
            const match = ogTitle.match(/^\s*.*?\s*-\s*(.*?)\s*-\s*BOMTOON/i);
            if (match) return formatChapter(match[1]);
        }
        if (hostname.endsWith('lezhin.es') && ogTitle) {
            const match = ogTitle.match(/^\s*.*?\s*-\s*(.*?)$/i);
            if (match) return formatChapter(match[1]);
        }
        if (hostname.endsWith('lezhin.jp')) {
            const match = location.pathname.match(VIEWER_ROUTE_REGEX_JP);
            if (match) {
                const chapterId = match[2];
                return sanitizeFileNamePart(chapterId.trim());
            }
        }
        if (hostname.endsWith('lezhinde.com') && ogTitle) {
            const match = ogTitle.match(/^\s*.*?\s*-\s*(.*?)\s*-\s*Lezhin\s*DE$/i);
            if (match) return formatChapter(match[1]);
        }
        if (hostname.endsWith('lezhinfr.com') && pageTitle) {
            const match = pageTitle.match(/^\s*.*?\s*-\s*(.*?)\s*-/);
            if (match) return formatChapter(match[1]);
        }
        if (hostname.endsWith('lezhinth.com') && ogTitle) {
            const match = ogTitle.match(/^\s*.*?\s*-\s*(.*?)\s*-\s*LEZHIN\s*TH$/i);
            if (match) {
                let chapterTitle = match[1].replace(/^ตอนที่\s*/i, '');
                return formatChapter(chapterTitle);
            }
        }
        if (hostname.endsWith('lezhinx.com') && ogTitle) {
            const match = ogTitle.match(/^(.*?)\s*-\s*(.*?)\s*-\s*Lezhin\s*X$/i);
            if (match) return formatChapter(match[2]);
        }
        return 'Unknown Chapter';
    }

    function sanitizeFileNamePart(str) {
        return str
            .replace(/[\\/:*?"<>|]/g, '_')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function generateImageFileName(index, total, format = 'jpg') {
        const digits = total >= 100 ? 3 : 2;
        const paddedIndex = String(index).padStart(digits, '0');
        return `${paddedIndex}.${format}`;
    }

    function initDownloadButtonObserver() {
        const observer = new MutationObserver(() => {
            if (!isChapterPage()) return;
            if (isMobileDevice()) return;
            if (!document.querySelector('.download-button')) {
                createDownloadButton();
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    function createDownloadButton() {
        if (!isChapterPage()) return;
        if (document.querySelector('.download-button')) return;
        if (isMobileDevice()) {
            throwDownloadError('MOBILE_DEVICE_NOT_SUPPORTED');
            return;
        }
        const globalHeader = getViewerHeaderContainer();
        let insertTarget;
        let regionClass;
        if (globalHeader) {
            insertTarget = globalHeader;
            regionClass = 'download-button-custom';
        } else {
            insertTarget = document.body;
            regionClass = 'download-button-default';
        }
        const btn = document.createElement('button');
        btn.classList.add('download-button', regionClass);
        btn.textContent = UI_BUTTON_LABELS.DEFAULT;
        btn.onclick = () => {
            detectRenderType();
            executeDownloadPipeline(btn);
        };
        insertTarget.appendChild(btn);
        const popup = document.createElement('div');
        popup.className = 'download-popup';
        popup.innerHTML = `
            <div class="download-popup-title"><strong>${SCRIPT_NAME_DEBUG}</strong></div>
            <div class="download-popup-version">
                <a href="https://github.com/OsborneLabs/Offline" target="_blank" rel="noopener noreferrer">Osborne</a>
                &nbsp;·&nbsp;
                v${SCRIPT_VERSION}
            </div>
            <div class="download-popup-links">
                <a href="https://github.com/OsborneLabs/Offline/issues" 
                target="_blank" 
                rel="noopener noreferrer" 
                style="text-decoration: underline;">
                Submit an issue
                </a>
            </div>
            <div class="download-popup-links">
                <a href="https://greasyfork.org/en/scripts/568060-offline-for-lezhin" 
                target="_blank" 
                rel="noopener noreferrer" 
                style="text-decoration: underline;">
                Update
                </a>
            </div>
        `;
        document.body.appendChild(popup);
        let showTimer = null;
        let hideTimer = null;

        function showPopup() {
            if (btn.disabled) return;
            const rect = btn.getBoundingClientRect();
            popup.style.top = rect.bottom + 8 + 'px';
            popup.style.left = rect.left + rect.width / 2 + 'px';
            popup.classList.add('visible');
        }

        function hidePopup() {
            popup.classList.remove('visible');
        }
        btn.addEventListener('mouseenter', () => {
            if (btn.disabled) return;
            clearTimeout(hideTimer);
            showTimer = setTimeout(showPopup, 1000);
        });
        btn.addEventListener('mouseleave', () => {
            clearTimeout(showTimer);
            hideTimer = setTimeout(hidePopup, 25);
        });
        popup.addEventListener('mouseenter', () => {
            clearTimeout(hideTimer);
        });
        popup.addEventListener('mouseleave', () => {
            hideTimer = setTimeout(hidePopup, 25);
        });
    }

    function removeDownloadButton() {
        const btn = document.querySelector('.download-button');
        if (btn) {
            btn.remove();
        }
    }

    function updateDownloadButton(btn, text) {
        btn.textContent = text;
    }

    function resetDownloadButton(btn) {
        setTimeout(() => {
            btn.textContent = UI_BUTTON_LABELS.DEFAULT;
        }, UI_BUTTON_RESET_DELAY_MS);
    }

    function lockPageInteraction() {
        document.body.classList.add('lock-site-ui');
    }

    function unlockPageInteraction() {
        document.body.classList.remove('lock-site-ui');
    }

    function lockPageScroll() {
        document.body.style.overflow = 'hidden';
    }

    function unlockPageScroll() {
        document.body.style.overflow = '';
    }

    function startDownloadSession() {
        return {
            cancelled: false,
            cancel() {
                this.cancelled = true;
            }
        };
    }

    function abortDownloadSession() {
        if (state.ui.activeDownload) {
            state.ui.activeDownload.cancel();
            state.ui.activeDownload = null;
        }
        state.canvas.buffer.clear();
        state.canvas.pages.clear();
        state.canvas.enabled = false;
        for (const img of state.blob.pages.values()) {
            if (img instanceof HTMLImageElement && img.src.startsWith('blob:')) {
                try {
                    URL.revokeObjectURL(img.src);
                } catch {}
            }
        }
        state.blob.buffer.clear();
        state.blob.pages.clear();
        state.blob.enabled = false;
    }

    function validateCollectedPageCount(collectedCount) {
        const renderType = state.viewer.type;
        const renderTypeLabel = (renderType || 'UNKNOWN').toUpperCase();
        let total;
        try {
            total = getTotalPageCount();
        } catch {
            total = getIndexedComicCuts().length;
        }
        const expected = collectedCount;
        const promoCount = Math.max(0, total - collectedCount);
        console.debug(
            `${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION} - ` +
            `TOTAL IMAGES: ${total} | ` +
            `PROMO IMAGES: ${promoCount} | ` +
            `EXPECTED IMAGES: ${expected} | ` +
            `COLLECTED IMAGES: ${collectedCount} | ` +
            `FINAL RENDERING METHOD: ${renderTypeLabel}`
        );
        return collectedCount === expected;
    }

    function validateCollectedImages(session, images) {
        if (session.cancelled) {
            throwDownloadError('DOWNLOAD_ABORTED');
        }
        if (!images || !images.length) {
            console.debug(
                `${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION} - NO IMAGES COLLECTED`
            );
            throwDownloadError('NO_IMAGES_COLLECTED');
        }
        const isValidCount = validateCollectedPageCount(images.length);
        if (!isValidCount) {
            console.debug(
                `${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION} - IMAGE COUNT MISMATCH`
            );
            throwDownloadError('IMAGE_COUNT_MISMATCH');
        }
        return images;
    }

    function findMissingPages(collectedMap) {
        if (!(collectedMap instanceof Map)) return [];
        const collected = new Set(collectedMap.keys());
        const expected = getAllPageIndexes();
        return expected.filter(index => !collected.has(index));
    }

    async function retryMissingPages(
        session,
        collectedMap,
        onProgress, {
            maxAttempts = 6,
            scrollDelay = 350,
            beforeAttempt = null,
            afterAttempt = null,
            idleWait = false,
            nudgeScroll = false
        } = {}
    ) {
        let previousMissingCount = Infinity;
        const delayMs = scrollDelay;
        for (let attempt = 0; attempt < maxAttempts && !session.cancelled; attempt++) {
            const missing = findMissingPages(collectedMap);
            if (!missing.length) break;
            if (missing.length >= previousMissingCount) break;
            previousMissingCount = missing.length;
            if (beforeAttempt) await beforeAttempt(missing);
            for (const index of missing) {
                if (session.cancelled) break;
                scrollToComicPage(index, {
                    instant: true,
                    allowLastPage: false
                });

                await new Promise(r => setTimeout(r, delayMs));
                onProgress(collectedMap.size, null);
            }
            if (nudgeScroll) {
                window.scrollBy(0, 1);
                window.scrollBy(0, -1);
            }
            if (afterAttempt) await afterAttempt(missing);
            if (idleWait) {
                const isFirstRetry = attempt === 0;
                const fewMissing = missing.length <= 2;
                await waitForCanvasIdle(
                    isFirstRetry ? 250 : (fewMissing ? 120 : 150),
                    isFirstRetry ? 900 : (fewMissing ? 400 : 500)
                );
            }
        }
    }

    async function collectWebpPages(session, onProgress) {
        const wrapper = getViewerContainer();
        if (!wrapper || session.cancelled) return [];
        state.ui.images.clear();
        const promoCheck = isPromoImage;
        const special = getViewerLayoutConfig();
        const cutsToUse = special.enabled ?
            special.safeCuts :
            getIndexedComicCuts();
        const stableCuts = [...cutsToUse];

        function waitForImageInjection(cut, timeout = 1500) {
            return new Promise(resolve => {
                const start = performance.now();

                function check() {
                    const img = cut.querySelector('img');
                    if (img && img.src && !img.src.startsWith('blob:')) {
                        return resolve(true);
                    }
                    if (performance.now() - start > timeout) {
                        return resolve(false);
                    }
                    requestAnimationFrame(check);
                }
                check();
            });
        }
        for (const cut of stableCuts) {
            if (session.cancelled || state.ui.phase !== 'collecting') break;
            const index = Number(cut.dataset.cutIndex);
            if (!Number.isFinite(index)) continue;
            scrollToComicPage(index, {
                instant: true
            });
            await waitForImageInjection(cut, 1500);
            const img = [...cut.querySelectorAll('img')].find(i =>
                i.src &&
                !i.src.startsWith('blob:') &&
                !promoCheck(i)
            );
            if (img && !state.ui.images.has(index)) {
                state.ui.images.set(index, img.src);
                onProgress(state.ui.images.size);
            }
        }
        return session.cancelled ? [] :
            getOrderedWebpPageList();
    }

    async function collectHorizontalWebpPages(session, onProgress) {
        state.ui.images.clear();
        const wrapper = document.querySelector(RENDER_PAGE_SELECTORS_HORIZONTAL.horizontalWrapper);
        const sliderBtn = document.querySelector(
            '[role="slider"][data-max][data-value]'
        );
        if (!wrapper || !sliderBtn || session.cancelled) {
            console.debug(`${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION} - CHAPTER SLIDER OR BUTTON NOT FOUND`);
            return [];
        }
        const getIndex = () => Number(sliderBtn.getAttribute('data-value'));
        const total = Number(sliderBtn.getAttribute('data-max'));
        const navPrev = wrapper.querySelector('button[class*="nav--left"]');
        const navNext = wrapper.querySelector('button[class*="nav--right"]');
        const getActiveImage = () => {
            const activeCut = wrapper.querySelector('[class*="cut--active"]');
            return activeCut?.querySelector('img') || null;
        };
        const waitForIndexChange = (previousIndex, timeout = 3000) => {
            return new Promise(resolve => {
                const start = Date.now();
                const tick = () => {
                    if (session.cancelled) return resolve(false);
                    const current = getIndex();
                    if (current !== previousIndex) {
                        return resolve(true);
                    }
                    if (Date.now() - start > timeout) {
                        return resolve(false);
                    }
                    requestAnimationFrame(tick);
                };
                tick();
            });
        };
        const waitForImageChange = (previousSrc, timeout = 3000) => {
            return new Promise(resolve => {
                const start = Date.now();
                const tick = () => {
                    if (session.cancelled) return resolve(false);
                    const img = getActiveImage();
                    if (img && img.src && img.src !== previousSrc) {
                        return resolve(true);
                    }
                    if (Date.now() - start > timeout) {
                        return resolve(false);
                    }
                    requestAnimationFrame(tick);
                };
                tick();
            });
        };
        let safety = 0;
        while (getIndex() > 1 && safety < 30 && !session.cancelled) {
            const prevIndex = getIndex();
            const prevSrc = getActiveImage()?.src;
            navPrev?.click();
            await Promise.all([
                waitForIndexChange(prevIndex),
                waitForImageChange(prevSrc)
            ]);
            safety++;
        }
        while (!session.cancelled) {
            const index = getIndex();
            const img = getActiveImage();
            console.debug(`${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION} - CURRENT INDEX:`, index);
            if (img && img.src && !state.ui.images.has(index)) {
                if (!isPromoImage(img)) {
                    state.ui.images.set(index, img.src);
                    onProgress(state.ui.images.size);
                }
            }
            if (index >= total) break;
            const previousIndex = index;
            const previousSrc = img?.src;
            navNext?.click();
            await Promise.all([
                waitForIndexChange(previousIndex),
                waitForImageChange(previousSrc)
            ]);
        }
        console.debug(`${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION} - TOTAL COLLECTED:`, state.ui.images.size);
        return session.cancelled ? [] : getOrderedWebpPageList();
    }

    function getOrderedWebpPageList() {
        return [...state.ui.images.entries()]
            .sort(([a], [b]) => a - b)
            .map(([, url]) => url);
    }

    async function convertWebpPagesToJpeg(session, urls, onProgress) {
        const files = {};
        const total = urls.length;
        let completed = 0;
        onProgress(0, total);
        const workerCount = getOptimalWorkerCount();
        const CAN_USE_OFFSCREEN =
            typeof OffscreenCanvas !== 'undefined' &&
            OffscreenCanvas.prototype.convertToBlob &&
            typeof createImageBitmap === 'function';
        const idleYield = () => new Promise(r => requestAnimationFrame(r));
        async function convertWebpToJpeg(webpBytes, quality = 0.92) {
            if (CAN_USE_OFFSCREEN) {
                const blob = new Blob([webpBytes], {
                    type: 'image/webp'
                });
                const bitmap = await createImageBitmap(blob);
                const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
                const ctx = canvas.getContext('2d', {
                    alpha: false
                });
                ctx.drawImage(bitmap, 0, 0);
                const jpegBlob = await canvas.convertToBlob({
                    type: 'image/jpeg',
                    quality
                });
                return new Uint8Array(await jpegBlob.arrayBuffer());
            }
            return new Promise((resolve, reject) => {
                const blob = new Blob([webpBytes], {
                    type: 'image/webp'
                });
                const img = new Image();
                const url = URL.createObjectURL(blob);
                img.onload = () => {
                    URL.revokeObjectURL(url);
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0);
                    canvas.toBlob(async jpegBlob => {
                        if (!jpegBlob) {
                            return reject(
                                new Error(
                                    DOWNLOAD_ERROR_MAP.JPEG_CONVERSION_FAILED.code
                                )
                            );
                        }
                        resolve(
                            new Uint8Array(
                                await jpegBlob.arrayBuffer()
                            )
                        );
                    }, 'image/jpeg', quality);
                };
                img.onerror = () => {
                    URL.revokeObjectURL(url);
                    reject(
                        new Error(
                            DOWNLOAD_ERROR_MAP.JPEG_CONVERSION_FAILED.code
                        )
                    );
                };
                img.src = url;
            });
        }
        const jobs = urls.map((url, index) => ({
            url,
            index
        }));
        const results = await taskQueue(workerCount, jobs, async ({
            url,
            index
        }) => {
            if (session.cancelled) return null;
            const webp = await getImageData(url);
            if (session.cancelled) return null;
            const jpeg = await convertWebpToJpeg(webp).catch(() => {
                throwDownloadError('JPEG_CONVERSION_FAILED');
            });
            if (session.cancelled) return null;
            completed++;
            onProgress(completed, total);
            if (completed % 2 === 0) await idleYield();
            return {
                name: generateImageFileName(index + 1, total, 'jpg'),
                data: jpeg
            };
        });
        for (const r of results) {
            if (r) files[r.name] = r.data;
        }
        return files;
    }

    function initCanvasDrawHook() {
        if (CanvasRenderingContext2D.prototype.__lezhinHooked) return;
        CanvasRenderingContext2D.prototype.__lezhinHooked = true;
        const originalDrawImage = CanvasRenderingContext2D.prototype.drawImage;
        CanvasRenderingContext2D.prototype.drawImage = function(img, ...args) {
            originalDrawImage.apply(this, [img, ...args]);
            state.canvas.lastDrawTs = performance.now();
            if (state.canvas.idleTimer) {
                clearTimeout(state.canvas.idleTimer);
            }
            state.canvas.idleTimer = setTimeout(() => {
                const resolver = state.canvas.idleResolver;
                state.canvas.idleResolver = null;
                if (resolver) resolver(true);
            }, state.canvas.idleWaitMs || 700);
            if (!img?.src || isPromoImage(img)) return;
            const op = getCanvasImageData(img, args);
            if (!op) return;
            const pageIndex = getVisiblePageIndex(this.canvas);
            if (!pageIndex) return;
            const store = state.canvas.enabled ?
                state.canvas.pages :
                state.canvas.buffer;
            if (!store.has(pageIndex)) {
                store.set(pageIndex, {
                    pageIndex,
                    url: img.src,
                    width: this.canvas.width,
                    height: this.canvas.height,
                    ops: []
                });
            }
            store.get(pageIndex).ops.push(op);
        };
    }

    function getCanvasImageData(img, a) {
        switch (a.length) {
            case 2:
                return {
                    sx: 0, sy: 0, sw: img.width, sh: img.height, dx: a[0], dy: a[1], dw: img.width, dh: img.height
                };
            case 4:
                return {
                    sx: 0, sy: 0, sw: img.width, sh: img.height, dx: a[0], dy: a[1], dw: a[2], dh: a[3]
                };
            case 8:
                return {
                    sx: a[0], sy: a[1], sw: a[2], sh: a[3], dx: a[4], dy: a[5], dw: a[6], dh: a[7]
                };
            default:
                return null;
        }
    }

    async function waitForCanvasIdle(ms = 700, timeout = 6000) {
        state.canvas.idleWaitMs = ms;
        if (!state.canvas.lastDrawTs) {
            return true;
        }
        return new Promise(resolve => {
            const timeoutId = setTimeout(() => {
                state.canvas.idleResolver = null;
                resolve(false);
            }, timeout);
            state.canvas.idleResolver = () => {
                clearTimeout(timeoutId);
                resolve(true);
            };
        });
    }

    async function collectCanvasPages(session, onProgress) {
        scrollToComicPage(null, 'smooth');
        state.canvas.pages = new Map(state.canvas.buffer);
        state.canvas.buffer.clear();
        state.canvas.enabled = true;
        const special = getViewerLayoutConfig();
        const cuts = special.enabled ?
            special.safeCuts :
            getIndexedComicCuts();
        const total = cuts.length;
        await new Promise(r => setTimeout(r, 300));
        for (const cut of cuts) {
            if (session.cancelled) break;
            scrollToComicPage(
                Number(cut.dataset.cutIndex),
                'smooth'
            );
            await new Promise(r => setTimeout(r, 300));
            onProgress(state.canvas.pages.size, total);
        }
        const missingInitial = findMissingPages(state.canvas.pages);
        if (!missingInitial.length) {
            state.canvas.enabled = false;
            return [...state.canvas.pages.values()]
                .filter(p => p.ops.length)
                .sort((a, b) => a.pageIndex - b.pageIndex);
        }
        state.canvas.enabled = false;
        let previousMissingCount = Infinity;
        for (let attempt = 0; attempt < 4 && !session.cancelled; attempt++) {
            const missing = findMissingPages(state.canvas.pages);
            if (!missing.length) break;
            if (missing.length >= previousMissingCount) break;
            previousMissingCount = missing.length;
            await retryMissingPages(
                session,
                state.canvas.pages,
                onProgress, {
                    beforeAttempt: async () => {
                        state.canvas.enabled = true;
                    },
                    afterAttempt: async () => {
                        state.canvas.enabled = false;
                    },
                    idleWait: true,
                    nudgeScroll: true
                }
            );
        }
        return [...state.canvas.pages.values()]
            .filter(p => p.ops.length)
            .sort((a, b) => a.pageIndex - b.pageIndex);
    }

    async function convertCanvasToPng(page) {
        const webpBytes = await getImageData(page.url);
        const blob = new Blob([webpBytes], {
            type: 'image/webp'
        });
        const img = new Image();
        const url = URL.createObjectURL(blob);
        img.src = url;
        await new Promise((resolve, reject) => {
            img.onload = () => {
                URL.revokeObjectURL(url);
                resolve();
            };
            img.onerror = e => {
                URL.revokeObjectURL(url);
                reject(e);
            };
        });
        const canvas = document.createElement('canvas');
        canvas.width = page.width;
        canvas.height = page.height;
        const ctx = canvas.getContext('2d');
        page.ops.forEach(op => {
            ctx.drawImage(
                img,
                op.sx, op.sy, op.sw, op.sh,
                op.dx, op.dy, op.dw, op.dh
            );
        });
        return new Promise(resolve => {
            canvas.toBlob(async blob => {
                const buf = await blob.arrayBuffer();
                resolve(new Uint8Array(buf));
            }, 'image/png');
        });
    }

    async function streamCanvasImagesToZip(session, pages, zip, onProgress) {
        const total = pages.length;
        let completed = 0;
        onProgress(0, total);
        const workerCount = getOptimalWorkerCount();
        await taskQueue(workerCount, pages, async (page, index) => {
            if (session.cancelled) return;
            const png = await convertCanvasToPng(page);
            if (!png || session.cancelled) return;
            const name = generateImageFileName(index + 1, total, 'png');
            const file = new fflate.ZipDeflate(name, {
                level: 6
            });
            zip.add(file);
            file.push(png, true);
            completed++;
            onProgress(completed, total);
        });
        return !session.cancelled;
    }

    function initBlobBackgroundCollector() {
        if (state.blob.observerInitialized) return;
        state.blob.observerInitialized = true;

        function getPageContainers() {
            for (const selector of RENDER_PAGE_SELECTORS) {
                const nodes = document.querySelectorAll(selector);
                if (nodes.length) return nodes;
            }
            return [];
        }

        function captureVisibleBlobs() {
            const containers = getPageContainers();
            if (!containers.length) return;
            containers.forEach((el, i) => {
                const index = i + 1;
                if (state.blob.pages.has(index)) return;
                const img = el.querySelector('img[src^="blob:"]');
                if (!img) return;
                if (!img.complete) return;
                state.blob.pages.set(index, img);
                console.debug(`${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION} - BACKGROUND BLOB STORED: ${index}`);
            });
        }
        const observer = new MutationObserver(() => {
            captureVisibleBlobs();
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true,
            attributeFilter: ['src']
        });
        captureVisibleBlobs();
    }

    async function collectBlobPages(session, onProgress) {
        async function collectBlobPagesDeterministic() {
            const WAIT_AFTER_SCROLL_MS = 120;
            const MAX_IDLE_ROUNDS = 60;
            const collected = new Map();
            const layout = getViewerLayoutConfig();
            let lastCount = 0;
            let idleRounds = 0;

            function getPageContainers() {
                for (const selector of RENDER_PAGE_SELECTORS) {
                    const nodes = document.querySelectorAll(selector);
                    if (nodes.length) {
                        return nodes;
                    }
                }
                return [];
            }

            function extractHydratedBlobs(containers) {
                const results = [];
                containers.forEach((el, i) => {
                    const img = el.querySelector('img[src^="blob:"]');
                    if (!img) return;
                    if (!img.complete) return;
                    const index = i + 1;
                    results.push({
                        index,
                        img
                    });
                });
                return results;
            }

            function scrollToLastCollected(totalContainers) {
                if (!collected.size) {
                    scrollToComicPage(1);
                    return;
                }
                const maxIndex = Math.max(...collected.keys());
                if (
                    layout.scroll.preventLastScroll &&
                    maxIndex >= totalContainers
                ) {
                    return;
                }
                scrollToComicPage(maxIndex, {
                    instant: false,
                    allowLastPage: !layout.scroll.preventLastScroll,
                    offset: layout.scroll.offset
                });
            }
            while (!session.cancelled) {
                const containers = getPageContainers();
                const totalContainers = containers.length;
                const blobs = extractHydratedBlobs(containers);
                blobs.forEach(({
                    index,
                    img
                }) => {
                    if (!collected.has(index)) {
                        collected.set(index, img);
                    }
                });
                onProgress?.(collected.size);
                if (
                    totalContainers > 0 &&
                    collected.size === totalContainers
                ) {
                    break;
                }
                if (collected.size === lastCount) {
                    idleRounds++;
                    if (idleRounds > MAX_IDLE_ROUNDS) {
                        break;
                    }
                } else {
                    idleRounds = 0;
                    lastCount = collected.size;
                }
                if (collected.size < totalContainers) {
                    scrollToLastCollected(totalContainers);
                    await new Promise(r =>
                        setTimeout(r, WAIT_AFTER_SCROLL_MS)
                    );
                }
            }
            return collected;
        }
        const collected = await collectBlobPagesDeterministic();
        for (const [index, img] of collected.entries()) {
            if (!state.blob.pages.has(index)) {
                state.blob.pages.set(index, img);
            }
        }
        return state.blob.pages;
    }

    function getOrderedBlobPageList(blobMap) {
        return [...blobMap.entries()]
            .sort(([a], [b]) => a - b)
            .map(([, img]) => img);
    }

    async function convertBlobImageToPng(img) {
        if (img.decode) {
            try {
                await img.decode();
            } catch {}
        } else if (!img.complete) {
            await new Promise(resolve => {
                img.onload = resolve;
                img.onerror = resolve;
            });
        }
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        return new Promise(resolve => {
            canvas.toBlob(async blob => {
                const buf = await blob.arrayBuffer();
                resolve(new Uint8Array(buf));
            }, "image/png");
        });
    }

    async function buildBlobImageFiles(session, images, onProgress) {
        const files = {};
        const total = images.length;
        onProgress(0, total);
        const workerCount = getOptimalWorkerCount();
        let completed = 0;
        const jobs = images.map((img, index) => ({
            img,
            index
        }));
        const results = await taskQueue(
            workerCount,
            jobs,
            async ({
                img,
                index
            }) => {
                if (session.cancelled) return null;
                const pngData = await convertBlobImageToPng(img);
                if (session.cancelled) return null;
                completed++;
                onProgress(completed, total);
                return {
                    name: generateImageFileName(index + 1, total, 'png'),
                    data: pngData
                };
            }
        );
        for (const r of results) {
            if (r) {
                files[r.name] = r.data;
            }
        }
        return files;
    }

    function createStreamingZip(series, chapter) {
        const chunks = [];
        let resolveFinal;
        let rejectFinal;
        const donePromise = new Promise((resolve, reject) => {
            resolveFinal = resolve;
            rejectFinal = reject;
        });
        const zip = new fflate.Zip((err, data, final) => {
            if (err) {
                console.debug(`${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION}: ZIP STREAM ERROR\n`, err);
                rejectFinal(new Error(
                    DOWNLOAD_ERROR_MAP.ZIP_CREATION_FAILED.code
                ));
                return;
            }
            if (data) {
                chunks.push(data);
            }
            if (final) {
                try {
                    const blob = new Blob(chunks, {
                        type: 'application/zip'
                    });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${series} - ${chapter}.zip`;
                    a.click();
                    setTimeout(() => URL.revokeObjectURL(url), 1000);
                    resolveFinal();
                } catch (e) {
                    console.debug(`${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION}: ZIP FINALIZE ERROR\n`, e);
                    rejectFinal(new Error(
                        DOWNLOAD_ERROR_MAP.ZIP_CREATION_FAILED.code
                    ));
                }
            }
        });
        return {
            zip,
            donePromise
        };
    }

    function getOptimalWorkerCount() {
        const cores = navigator.hardwareConcurrency || 4;
        const memory = navigator.deviceMemory || 4;
        const isMobile = isMobileDevice();
        let workers = Math.floor(cores / 2);
        if (memory <= 2) {
            workers = 2;
        } else if (memory <= 4) {
            workers = Math.min(workers, 3);
        }
        if (isMobile) {
            workers = Math.min(workers, 3);
        }
        workers = Math.max(2, Math.min(6, workers));
        return workers;
    }

    async function taskQueue(limit, items, worker) {
        const results = [];
        const executing = [];
        const runWorker = worker;
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const index = i;
            const p = Promise.resolve().then(() => runWorker(item, index));
            results.push(p);
            if (limit <= items.length) {
                const e = p.then(() => {
                    executing.splice(executing.indexOf(e), 1);
                });
                executing.push(e);
                if (executing.length >= limit) {
                    await Promise.race(executing);
                }
            }
        }
        return Promise.all(results);
    }

    function getImageData(url) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                responseType: 'arraybuffer',
                onload: r =>
                    r.status === 200 ?
                    resolve(new Uint8Array(r.response)) : reject(r.status),
                onerror: reject
            });
        });
    }

    async function executeDownloadPipeline(btn) {
        if (state.ui.isDownloading) return;
        const renderType = resolveRenderType();
        if (!renderType) return;
        state.ui.isDownloading = true;
        state.ui.phase = 'collecting';
        const session = startDownloadSession();
        state.ui.activeDownload = session;
        const headerOverrideStyle = applyViewerHeaderOverride();
        btn.disabled = true;
        const setLabel = label => updateDownloadButton(btn, label);
        const onCollect = c => setLabel(UI_BUTTON_LABELS.COLLECTING(c));
        const onConvert = (c, t) =>
            setLabel(UI_BUTTON_LABELS.CONVERTING(c, t));
        const finalizeZip = async (zip, donePromise) => {
            try {
                zip.end();
                await donePromise;
            } catch {
                throwDownloadError('ZIP_CREATION_FAILED');
            }
        };
        const createZipInstance = () =>
            createStreamingZip(
                getSeriesTitle(),
                getSeriesChapter()
            );
        setLabel(UI_BUTTON_LABELS.COLLECTING(0));
        await new Promise(requestAnimationFrame);
        let completed = false;
        try {
            lockPageScroll();
            lockPageInteraction();
            scrollToTop();
            await new Promise(r => setTimeout(r, 300));
            let files = null;
            if (renderType === 'webp') {
                const images = isHorizontalViewerLayout() ?
                    await collectHorizontalWebpPages(session, onCollect) :
                    await collectWebpPages(session, onCollect);
                validateCollectedImages(session, images);
                await retryMissingPages(
                    session,
                    state.ui.images,
                    onCollect
                );
                const finalImages = validateCollectedImages(
                    session,
                    getOrderedWebpPageList()
                );
                state.ui.phase = 'downloading';
                files = await convertWebpPagesToJpeg(
                    session,
                    finalImages,
                    onConvert
                );
            }
            if (renderType === 'canvas') {
                const pages = await collectCanvasPages(
                    session,
                    onCollect
                );
                const validPages = validateCollectedImages(
                    session,
                    pages
                );
                state.ui.phase = 'downloading';
                const {
                    zip,
                    donePromise
                } =
                createZipInstance();
                const success =
                    await streamCanvasImagesToZip(
                        session,
                        validPages,
                        zip,
                        onConvert
                    );
                if (!success) {
                    throwDownloadError('DOWNLOAD_ABORTED');
                }
                await finalizeZip(zip, donePromise);
            }
            if (renderType === 'blob') {
                const layout = getViewerLayoutConfig();
                const expectedCount =
                    layout.pageSource === 'cuts' ?
                    getAllPageIndexes().length :
                    getTotalPageCount();
                if (state.blob.pages.size !== expectedCount) {
                    state.blob.pages.clear();
                    for (const [index, data] of state.blob.buffer) {
                        const blob = new Blob([data], {
                            type: 'image/png'
                        });
                        const url =
                            URL.createObjectURL(blob);
                        const img = new Image();
                        img.src = url;
                        state.blob.pages.set(index, img);
                    }
                    state.blob.enabled = true;
                    state.blob.buffer.clear();
                    await collectBlobPages(
                        session,
                        onCollect
                    );
                }
                const orderedImages =
                    validateCollectedImages(
                        session,
                        getOrderedBlobPageList(
                            state.blob.pages
                        )
                    );
                state.ui.phase = 'downloading';
                files = await buildBlobImageFiles(
                    session,
                    orderedImages,
                    onConvert
                );
            }
            if (renderType !== 'canvas') {
                if (session.cancelled || !files) {
                    throwDownloadError('DOWNLOAD_ABORTED');
                }
                if (!Object.keys(files).length) {
                    throwDownloadError('NO_IMAGES_COLLECTED');
                }
                const {
                    zip,
                    donePromise
                } =
                createZipInstance();
                const entries = Object.entries(files);
                let completedCount = 0;
                const total = entries.length;
                for (const [name, data] of entries) {
                    if (session.cancelled) break;
                    const file = new fflate.ZipDeflate(
                        name, {
                            level: 6
                        }
                    );
                    zip.add(file);
                    file.push(data, true);
                    completedCount++;
                    onConvert(completedCount, total);
                }
                await finalizeZip(zip, donePromise);
            }
            setLabel(UI_BUTTON_LABELS.COMPLETE);
            resetDownloadButton(btn);
            completed = true;
        } catch (e) {
            handleDownloadError(e);
            setLabel(UI_BUTTON_LABELS.DEFAULT);
        } finally {
            state.ui.phase = 'idle';
            state.ui.isDownloading = false;
            if (state.ui.activeDownload === session) {
                state.ui.activeDownload = null;
            }
            btn.disabled = false;
            unlockPageScroll();
            unlockPageInteraction();
            if (headerOverrideStyle) {
                headerOverrideStyle.remove();
            }
            if (
                completed &&
                !sessionStorage.getItem(
                    UI_AUTO_REFRESH_FLAG
                )
            ) {
                sessionStorage.setItem(
                    UI_AUTO_REFRESH_FLAG,
                    '1'
                );
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
                setTimeout(() => {
                    location.reload();
                }, 700);
            }
        }
    }

    function createToastContainer() {
        if (document.getElementById('lezhin-toast-container')) return;
        const container = document.createElement('div');
        container.id = 'lezhin-toast-container';
        document.body.appendChild(container);
    }

    function showToast(message) {
        createToastContainer();
        const toast = document.createElement('div');
        toast.className = 'lezhin-toast';
        const text = document.createElement('span');
        text.textContent = message;
        const close = document.createElement('button');
        close.className = 'lezhin-toast-close';
        close.textContent = '×';
        close.onclick = () => closeToast(toast);
        toast.appendChild(text);
        toast.appendChild(close);
        document
            .getElementById('lezhin-toast-container')
            .appendChild(toast);
        setTimeout(() => {
            closeToast(toast);
        }, UI_TOAST_DURATION_MS);
    }

    function closeToast(toast) {
        if (toast.classList.contains('closing')) return;
        toast.classList.add('closing');
        toast.addEventListener(
            'animationend',
            () => toast.remove(), {
                once: true
            }
        );
    }

    function showErrorMessage(message) {
        showToast(message, 'error');
    }

    function throwDownloadError(error) {
        if (error instanceof Error) {
            if (DOWNLOAD_ERROR_INDEX[error.message]) {
                throw error;
            }
            throw new Error(
                DOWNLOAD_ERROR_MAP.UNKNOWN_ERROR.code
            );
        }
        if (error?.code) {
            throw new Error(error.code);
        }
        if (typeof error === 'string' && DOWNLOAD_ERROR_MAP[error]) {
            throw new Error(
                DOWNLOAD_ERROR_MAP[error].code
            );
        }
        if (typeof error === 'string' && DOWNLOAD_ERROR_INDEX[error]) {
            throw new Error(error);
        }
        throw new Error(
            DOWNLOAD_ERROR_MAP.UNKNOWN_ERROR.code
        );
    }

    function handleDownloadError(error) {
        const known = DOWNLOAD_ERROR_INDEX[error?.message];
        if (known) {
            showErrorMessage(known.message);
            return;
        }
        console.debug(`${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION}: DOWNLOAD ERROR OCCURRED\n`, error);
        showErrorMessage(
            DOWNLOAD_ERROR_MAP.UNKNOWN_ERROR.message
        );
    }

    window.addEventListener('load', init);

})();