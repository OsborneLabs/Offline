// ==UserScript==
// @name         Offline for Lezhin
// @namespace    https://github.com/OsborneLabs
// @version      2.1.1
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
    const SCRIPT_VERSION = typeof GM_info !== 'undefined' ? GM_info.script.version : 'unknown';
    const STORAGE_KEY_AUTO_REFRESH = 'autoRefresh';
    const STORAGE_KEY_SMALL_FILE_SIZE = 'small-file-size';
    const STORAGE_KEY_DIM_SCREEN = 'dim-screen';
    const UI_TOAST_DURATION_BY_SEVERITY = {
        normal: 10000,
        important: 30000,
        critical: 60000
    };
    const UI_BUTTON_RESET_DELAY_MS = 3000;
    const UI_BUTTON_LABELS = {
        DEFAULT: 'Download',
        COLLECTING: c => c === 0 ? 'Starting...' : `Collecting: ${c}`,
        DOWNLOADING: (c, t) => `Downloading: ${c}/${t}`,
        CONVERTING: (c, t) => t && c >= t - 1 ? 'Finishing...' : c === 0 ? 'Converting...' : t ? `Converting: ${c}/${t}` : `Converting: ${c}`,
        COMPLETE: 'Complete!',
        DIAG_DEFAULT: 'Run Diagnostic',
        DIAGNOSING: 'Diagnosing...',
    };
    const UI_ICON_SET = {
        bookmark: `<svg class="bookmark-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28"><path d="M9.25 3.5C7.45507 3.5 6 4.95507 6 6.75V24.75C6 25.0348 6.16133 25.2951 6.41643 25.4217C6.67153 25.5484 6.97638 25.5197 7.20329 25.3475L14 20.1914L20.7967 25.3475C21.0236 25.5197 21.3285 25.5484 21.5836 25.4217C21.8387 25.2951 22 25.0348 22 24.75V6.75C22 4.95507 20.5449 3.5 18.75 3.5H9.25Z" fill="white"/></svg>`,
        heart: `<svg class="heart-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path d="M12.8198687,5.57958759 L11.9991485,6.40209417 L11.1758977,5.57884333 C9.07682963,3.47977526 5.67356786,3.47977526 3.5744998,5.57884333 C1.47543173,7.6779114 1.47543173,11.0811732 3.5744998,13.1802412 L11.4698687,21.0756101 C11.7627619,21.3685033 12.2376356,21.3685033 12.5305288,21.0756101 L20.4319958,13.1787767 C22.5263889,11.0727481 22.5299763,7.6790351 20.4305288,5.57958759 C18.3276384,3.4766972 14.9227559,3.47670037 12.8198687,5.57958759 Z"/></svg>`,
        megaphone: `<svg class="megaphone-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28"><path d="M26.0008 7.35334C26.0008 5.54646 24.2879 4.23059 22.5421 4.69622L4.04548 9.62939C2.84171 9.95045 2.00415 11.0407 2.00415 12.2865V15.7136C2.00415 16.9594 2.84171 18.0496 4.04548 18.3707L7 19.1587V19.5C7 21.9853 9.01472 24 11.5 24C13.2899 24 14.8357 22.955 15.5606 21.4419L22.5421 23.3039C24.2879 23.7695 26.0008 22.4536 26.0008 20.6468V7.35334ZM8.50057 19.5589L14.0722 21.0449C13.5474 21.9168 12.5918 22.5 11.5 22.5C9.86282 22.5 8.53195 21.1886 8.50057 19.5589Z"/></svg>`,
        update: `<svg class="update-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g transform="rotate(90 12 12)"><path d="M7.94822962,5.02850432 C8.2831456,5.46765091 8.19865,6.09515261 7.75950341,6.4300686 C6.03254452,7.74713709 5,9.78703304 5,12 C5,15.4973075 7.56475199,18.395585 10.9159977,18.9165744 L10.2071068,18.2071068 C9.81658249,17.1834175 9.81658249,17.1834175 10.2071068,16.7928932 C10.5976311,16.4023689 11.2307961,16.4023689 11.6213203,16.7928932 L14.1213203,19.2928932 C14.5118446,19.6834175 14.5118446,20.3165825 14.1213203,20.7071068 L11.6213203,23.2071068 C11.2307961,23.5976311 10.5976311,23.5976311 10.2071068,23.2071068 C9.81658249,22.8165825 9.81658249,22.1834175 10.2071068,21.7928932 L11.0502786,20.9504867 C6.52614758,20.4760098 3,16.6497928 3,12 C3,9.15643984 4.32881972,6.5312223 6.54666534,4.83977811 C6.98581193,4.50486213 7.61331363,4.58935773 7.94822962,5.02850432 Z M9.87867966,3.29289322 L12.3786797,0.792893219 C12.7692039,0.402368927 13.4023689,0.402368927 13.7928932,0.792893219 C14.1533772,1.15337718 14.1811067,1.72060824 13.8760818,2.11289944 L13.7928932,2.20710678 L12.9497214,3.0495133 C17.4738524,3.52399021 21,7.35020716 21,12 C21,14.7198329 19.7848559,17.243156 17.7284056,18.9418543 C17.3026041,19.2935809 16.6722931,19.2335313 16.3205666,18.8077299 C15.96884,18.3819284 16.0288896,17.7516174 16.454691,17.3998909 C18.0559569,16.0771906 19,14.1168256 19,12 C19,8.50269253 16.435248,5.60441498 13.0840023,5.08342564 L13.7928932,5.79289322 C14.1834175,6.18341751 14.1834175,6.81658249 13.7928932,7.20710678 C13.4324093,7.56759074 12.8651782,7.59532028 12.472887,7.29029539 L12.3786797,7.20710678 L9.87867966,4.70710678 C9.51819569,4.34662282 9.49046616,3.77939176 9.79549105,3.38710056 L9.87867966,3.29289322 L12.3786797,0.792893219 L9.87867966,3.29289322 Z"/></g></svg>`,
        trash: `<svg class="trash-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path fill="white" d="M24,6.75 C27.3750735,6.75 30.1253119,9.4252368 30.245878,12.7708731 L30.25,13.0010013 L37,13 C37.9664983,13 38.75,13.7835017 38.75,14.75 C38.75,15.6681734 38.0428897,16.4211923 37.1435272,16.4941988 L37,16.5 L35.833,16.5 L34.2058308,38.0698451 C34.0385226,40.2866784 32.1910211,42 29.9678833,42 L18.0321167,42 C15.8089789,42 13.9614774,40.2866784 13.7941692,38.0698451 L12.166,16.5 L11,16.5 C10.0818266,16.5 9.32880766,15.7928897 9.2558012,14.8935272 L9.25,14.75 C9.25,13.8318266 9.95711027,13.0788077 10.8564728,13.0058012 L11,13 L17.75,13 C17.75,9.70163274 20.305017,7.00002168 23.5438239,6.76639376 L23.7708731,6.75412198 L24,6.75 Z M27.75,19.75 C27.1027913,19.75 26.5704661,20.2418747 26.5064536,20.8721948 L26.5,21 L26.5,33 L26.5064536,33.1278052 C26.5704661,33.7581253 27.1027913,34.25 27.75,34.25 C28.3972087,34.25 28.9295339,33.7581253 28.9935464,33.1278052 L29,33 L29,21 L28.9935464,20.8721948 C28.9295339,20.2418747 28.3972087,19.75 27.75,19.75 Z M20.25,19.75 C19.6027913,19.75 19.0704661,20.2418747 19.0064536,20.8721948 L19,21 L19,33 L19.0064536,33.1278052 C19.0704661,33.7581253 19.6027913,34.25 20.25,34.25 C20.8972087,34.25 21.4295339,33.7581253 21.4935464,33.1278052 L21.5,33 L21.5,21 L21.4935464,20.8721948 C21.4295339,20.2418747 20.8972087,19.75 20.25,19.75 Z M24.1675223,10.2550188 L24,10.25 C22.5374682,10.25 21.3415957,11.3917046 21.2550188,12.8324777 L21.2500002,13.0010036 L26.7500002,13 C26.7500002,11.5374682 25.6082954,10.3415957 24.1675223,10.2550188 Z"/></svg>`
    };

    const VIEWER_ALTERNATE_DOMAINS = [
        'beltoon.jp', 'bomtoon.com', 'bomtoon.tw', 'lezhin.es', 'lezhinde.com', 'lezhinfr.com', 'lezhinth.com'
    ];

    const VIEWER_ROUTE_REGEX_JP =
        /^\/comic\/([^\/]+)\/(?:chapter|volume)\/([^\/]+)\/viewer\/?$/;

    const RENDER_DETECTORS = {
        webp: {
            detect(wrapper) {
                const imgs = [...wrapper.querySelectorAll('img')]
                    .filter(img =>
                        img.src &&
                        !isPromoImage(img)
                    );

                return imgs.length >= 5;
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
        kr: {
            horizontalWrapper: 'div[class^="pageView__cutWrap"]',
            horizontalNavNext: 'button[class*="nav--right"]'
        },
        jp: {
            horizontalWrapper: 'div[class^="HorizontalViewer_root__"]',
            spread: 'div[class^="Spread_spread__"]',
        }
    };

    const RENDER_PAGE_SELECTORS = [
        RENDER_PAGE_SELECTORS_HORIZONTAL.kr.horizontalWrapper,
        '.scroll-view > [data-cut-index]',
        'div[class^="ImageContainer__Container-"]',
        'div[class^="sc-"][width][height]',
        'div[class^="scrollViewCut__"]',
        'div[class^="VerticalViewer_page_container"]'
    ];

    const VIEWER_CONTAINER_SELECTORS = [
        '[class^="CoreViewer_viewer_wrapper__"]',
        'div.scroll-view',
        'div[class^="ImageContainer__Container"]',
        'div[class^="pageView__"]',
        'div[class^="sc-"]',
        'div[class^="scrollViewWrapper__"]'
    ];

    const UI_PAGE_SELECTORS = {
        footer: 'div[class^="Footer_footerContainer__"]',
        sliders: [
            'input[type="range"][max]',
            '[class^="lzSlider__"] button[data-max]'
        ]
    };

    const DOWNLOAD_ERROR_MAP = {
        BLOB_CAPTURE_FAILED: {
            code: 'blob-capture-failed',
            message: 'Failed to capture blob images',
            severity: 'normal'
        },
        DOWNLOAD_ABORTED: {
            code: 'download-aborted',
            message: 'Download error occurred',
            severity: 'normal'
        },
        IMAGE_ACCESS_DENIED: {
            code: 'image-access-denied',
            message: 'Image access expired (refresh the page)',
            severity: 'important'
        },
        IMAGE_COUNT_MISMATCH: {
            code: 'image-count-mismatch',
            message: 'Failed to collect all images',
            severity: 'important'
        },
        IMAGE_REQUEST_FAILED: {
            code: 'image-request-failed',
            message: 'Failed image request due to network',
            severity: 'normal'
        },
        JPEG_CONVERSION_FAILED: {
            code: 'jpeg-conversion-failed',
            message: 'Failed to convert JPEG images',
            severity: 'normal'
        },
        MOBILE_DEVICES_NOT_SUPPORTED: {
            code: 'mobile-devices-not-supported',
            message: 'Offline mobile not supported',
            severity: 'important'
        },
        NETWORK_ERROR: {
            code: 'network-error',
            message: 'A network error occurred',
            severity: 'normal'
        },
        NO_IMAGES_COLLECTED: {
            code: 'no-images-collected',
            message: 'Images couldn\'t be collected',
            severity: 'important'
        },
        REQUEST_TIMEOUT: {
            code: 'request-timeout',
            message: 'Image request timed out',
            severity: 'normal'
        },
        TOTAL_PAGE_COUNT_NOT_FOUND: {
            code: 'total-page-count-not-found',
            message: 'Page count not found',
            severity: 'critical'
        },
        UNKNOWN_ERROR: {
            code: 'unknown-error',
            message: 'An unexpected error occurred',
            severity: 'critical'
        },
        VIEWER_CONTAINER_NOT_FOUND: {
            code: 'viewer-container-not-found',
            message: 'View container not found',
            severity: 'critical'
        },
        ZIP_CREATION_FAILED: {
            code: 'zip-creation-failed',
            message: 'ZIP file couldn\'t be created',
            severity: 'important'
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
        blob: {
            enabled: false,
            buffer: new Map(),
            pages: new Map()
        },
        canvas: {
            enabled: false,
            lastDrawTs: 0,
            idleTimer: null,
            idleResolver: null,
            buffer: new Map(),
            pages: new Map()
        },
        images: {
            loggedPromoImages: new Set()
        },
        ui: {
            isDownloading: false,
            phase: 'idle',
            activeDownload: null,
            spaNavigated: false,
            images: new Map()
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
                --color-app-button-disabled: #FF5254;
                --color-app-button-hover: #C4161C;
                --color-app-button-popup-default: rgba(22, 22, 22, 0.98);
                --color-app-dim-overlay: rgba(0, 0, 0, 0.55);
                --color-app-divider: rgba(255, 255, 255, 0.08);
                --color-app-icon-bookmark: white;
                --color-app-icon-default: rgba(255, 255, 255, 0.45);
                --color-app-icon-heart-hover: red;
                --color-app-icon-megaphone-hover: gold;
                --color-app-icon-update-hover: white;
                --color-app-popup-tooltip: rgba(50, 50, 50, 0.97);
                --color-app-switch-off: rgba(255, 255, 255, 0.18);
                --color-app-switch-on: #2AA866;
                --color-app-switch-thumb: white;
                --color-app-text-default: white;
                --color-app-text-muted: rgba(255, 255, 255, 0.45);
                --color-app-text-secondary: rgba(255, 255, 255, 0.70);
                --font-app-default: 'Pretendard', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                --size-app-button-height: 28px;
                --size-text-button-default: 13px;
                --size-text-popup-meta-default: 11px;
                --size-text-popup-section-highlight: 11px;
                --size-text-popup-section-label: 12px;
                --size-text-popup-title-default: 19px;
                --size-text-toast-default: 15px;
            }
            @font-face {
                font-family: 'Pretendard';
                font-style: normal;
                font-weight: 100 900;
                font-display: swap;
                src: url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3/packages/pretendard/dist/web/variable/woff2-dynamic-subset/PretendardVariable.subset.91.woff2') format('woff2');
            }
            @keyframes toast-in {
                0% { opacity: 0; transform: translateY(-16px) scale(0.96); }
                60% { opacity: 1; transform: translateY(2px) scale(1.01); }
                100% { opacity: 1; transform: translateY(0) scale(1); }
            }
            @keyframes toast-out {
                0% { opacity: 1; transform: translateY(0) scale(1); }
                40% { opacity: 1; transform: translateY(2px) scale(1.01); }
                100% { opacity: 0; transform: translateY(-16px) scale(0.96); }
            }
            #lezhin-toast-container {
                display: flex;
                flex-direction: column;
                gap: 10px;
                position: fixed;
                top: 20px;
                left: 50%;
                z-index: 9999;
                transform: translateX(-50%);
                pointer-events: none;
            }
            .lezhin-toast {
                position: relative;
                display: flex;
                align-items: center;
                justify-content: center;
                min-width: 230px;
                max-width: 360px;
                padding: 14px 18px;
                border: none;
                border-radius: 18px;
                overflow: hidden;
                font-size: var(--size-text-toast-default);
                color: white;
                background: rgba(60, 60, 65, 0.72);
                backdrop-filter: blur(20px) saturate(180%);
                -webkit-backdrop-filter: blur(20px) saturate(180%);
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.35), 0 1px 1px rgba(0, 0, 0, 0.1);
                cursor: pointer;
                opacity: 0;
                animation: toast-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards;
                pointer-events: auto;
            }
            .lezhin-toast, .download-button, .download-popup {
                font-family: var(--font-app-default);
            }
            .lezhin-toast.closing {
                animation: toast-out 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards;
            }
            .lezhin-toast-text {
                opacity: 1;
                transition: opacity 0.1s linear 0.15s;
            }
            .lezhin-toast:hover .lezhin-toast-text {
                opacity: 0;
                transition: opacity 0.08s linear 0s;
            }
            .lezhin-toast-icon {
                position: absolute;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.1s linear 0s;
            }
            .lezhin-toast:hover .lezhin-toast-icon {
                opacity: 1;
                transition: opacity 0.15s linear 0.08s;
            }
            .download-button {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                position: fixed;
                top: 3.5%;
                left: 50%;
                z-index: 9998;
                height: var(--size-app-button-height);
                padding: 6px 10px;
                border: none;
                border-radius: 20px;
                font-size: var(--size-text-button-default);
                font-weight: 500;
                color: var(--color-app-text-default);
                background: var(--color-app-button-default);
                transform: translate(-50%, -50%);
                cursor: pointer;
                user-select: none;
                transition: background-color 0.20s ease;
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
                width: 400px;
                padding: 16px;
                border-radius: 20px;
                color: white;
                background: var(--color-app-button-popup-default);
                box-shadow: 0 4px 24px rgba(0,0,0,0.45);
                opacity: 0;
                transform: translateX(-50%);
                pointer-events: none;
                user-select: none;
                transition: opacity 0.20s ease, visibility 0.20s ease;
                visibility: hidden;
            }
            .download-popup.visible {
                opacity: 1;
                pointer-events: auto;
                visibility: visible;
            }
            .download-popup-title {
                display: flex;
                align-items: center;
                gap: 7px;
                margin-bottom: 2px;
                font-size: var(--size-text-popup-title-default);
                font-weight: 700;
                letter-spacing: -0.01em;
            }
            .download-popup-meta {
                display: flex;
                flex-wrap: wrap;
                align-items: center;
                gap: 6px;
                margin-top: 0;
                margin-bottom: 14px;
                font-size: var(--size-text-popup-meta-default);
                color: var(--color-app-text-muted);
            }
            .download-popup-meta a {
                text-decoration: none;
                color: var(--color-app-text-muted);
            }
            .download-popup-meta a:hover {
                text-decoration: underline;
                color: var(--color-app-text-secondary);
            }
            .download-popup-meta-sep {
                opacity: 0.4;
            }
            .download-popup-divider {
                height: 1px;
                margin: 0 0 14px 0;
                background: var(--color-app-divider);
            }
            .download-popup-section-title {
                margin-bottom: 10px;
                font-size: var(--size-text-popup-meta-default);
                font-weight: 600;
                letter-spacing: 0.06em;
                text-transform: uppercase;
                color: var(--color-app-text-muted);
            }
            .download-popup-setting-row {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 12px;
            }
            .download-popup-setting-text {
                flex: 1;
                min-width: 0;
            }
            .download-popup-setting-label {
                margin-bottom: 2px;
                font-size: var(--size-text-popup-section-label);
                font-weight: 600;
                line-height: 1.3;
                color: white;
            }
            .download-popup-setting-highlight {
                font-size: var(--size-text-popup-section-highlight);
                line-height: 1.4;
                color: var(--color-app-text-secondary);
                margin-bottom: 10px;
            }
            .switch {
                flex-shrink: 0;
                position: relative;
                width: 36px;
                height: 21px;
                cursor: pointer;
            }
            .switch input {
                position: absolute;
                width: 0;
                height: 0;
                opacity: 0;
            }
            .switch-track {
                position: absolute;
                inset: 0;
                border-radius: 21px;
                background: var(--color-app-switch-off);
                transition: background 0.22s ease;
            }
            .switch input:checked + .switch-track {
                background: var(--color-app-switch-on);
            }
            .switch-thumb {
                position: absolute;
                top: 2.5px;
                left: 2.5px;
                width: 16px;
                height: 16px;
                border-radius: 50%;
                background: var(--color-app-switch-thumb);
                transition: transform 0.22s ease;
            }
            .switch input:checked ~ .switch-thumb {
                transform: translateX(15px);
            }
            .diagnostic-button {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 100%;
                height: var(--size-app-button-height);
                padding: 6px 10px;
                border: none;
                border-radius: 8px;
                font-family: var(--font-app-default);
                font-size: var(--size-text-button-default);
                font-weight: 500;
                color: var(--color-app-text-secondary);
                background: rgba(255, 255, 255, 0.07);
                cursor: pointer;
                transition: background-color 0.20s ease, color 0.20s ease;
            }
            .diagnostic-button:hover:not(:disabled) {
                background: rgba(255, 255, 255, 0.12);
                color: white;
            }
            .diagnostic-button:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            .download-popup-sections {
                display: flex;
                align-items: stretch;
                gap: 14px;
            }
            .download-popup-section {
                flex: 1;
                min-width: 0;
            }
            .download-popup-section-divider {
                width: 1px;
                flex-shrink: 0;
                background: var(--color-app-divider);
            }
            .download-popup-section .download-popup-setting-row + .download-popup-setting-row {
                margin-top: 12px;
            }
            .icon-tooltip {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                position: relative;
            }
            .icon-tooltip::after {
                content: attr(data-tooltip);
                position: absolute;
                bottom: calc(100% + 8px);
                left: 50%;
                z-index: 9999;
                padding: 6px 8px;
                border-radius: 8px;
                font-size: 11px;
                white-space: nowrap;
                color: white;
                background: var(--color-app-popup-tooltip);
                opacity: 0;
                transform: translateX(-50%) translateY(4px);
                pointer-events: none;
                transition: opacity 0.2s ease, transform 0.2s ease;
            }
            .icon-tooltip::before {
                content: "";
                position: absolute;
                bottom: calc(100% + 3px);
                left: 50%;
                z-index: 9998;
                border: 5px solid transparent;
                opacity: 0;
                transform: translateX(-50%) translateY(4px);
                pointer-events: none;
                transition: opacity 0.2s ease, transform 0.2s ease;
            }
            .icon-tooltip:hover::after, .icon-tooltip:hover::before {
                opacity: 1;
                transform: translateX(-50%) translateY(0);
            }
            .bookmark-icon {
                display: block;
                flex-shrink: 0;
                width: 1em;
                height: 1em;
                fill: var(--color-app-icon-bookmark);
            }
            .update-icon {
                width: 12px;
                height: 12px;
                transform-origin: center;
                transition: transform 0.45s ease, fill 0.25s ease;
            }
            .update-icon:hover {
                transform: rotate(360deg);
                fill: var(--color-app-icon-update-hover);
            }
            .megaphone-icon {
                width: 11px;
                height: 11px;
                transition: fill 0.25s ease;
            }
            .megaphone-icon:hover {
                fill: var(--color-app-icon-megaphone-hover);
            }
            .heart-icon {
                width: 11px;
                height: 11px;
                transition: fill 0.25s ease;
            }
            .heart-icon:hover {
                fill: var(--color-app-icon-heart-hover);
            }
            .trash-icon {
                display: block;
                width: 22px;
                height: 22px;
                flex-shrink: 0;
            }
            .update-icon, .megaphone-icon, .heart-icon {
                display: block;
                fill: var(--color-app-icon-default);
            }
            .download-button, .download-button *, .download-popup, .download-popup *, .lezhin-toast, .lezhin-toast * {
                user-select: none !important;
            }
            .lezhin-dim-overlay {
                position: fixed;
                inset: 0;
                z-index: 9990;
                background: var(--color-app-dim-overlay);
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.25s ease;
            }
            .lezhin-dim-overlay.visible {
                opacity: 1;
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
        sessionStorage.removeItem(STORAGE_KEY_AUTO_REFRESH);
        initScriptObservers();
        disableSiteTelemetry();
        createStyles();
        createDimOverlay();
        createDownloadButton();
    }

    function observeURLMutation() {
        let previousPath = location.pathname;
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
            if (initObserver) {
                initObserver.disconnect();
                initObserver = null;
            }
        };
        const onChapterEnter = () => {
            let initialized = false;
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
                setSinglePageLayout();
            };
            initObserver = new MutationObserver(tryInit);
            initObserver.observe(document.body, {
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

    function initScriptObservers() {
        observeURLMutation();
        initDownloadButtonObserver();
        initCanvasDrawHook();
        initBlobBackgroundCollector();
    }

    function initDownloadButtonObserver() {
        const observer = new MutationObserver(() => {
            const existingButton = document.querySelector('.download-button');
            if (!isChapterPage() || isMobileDevice()) {
                existingButton?.remove();
                return;
            }
            if (!existingButton) {
                createDownloadButton();
            }
        });
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
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
        if (/\/comments\/?$/.test(url)) {
            return false;
        }
        if (hasPurchaseModal()) {
            return false;
        }
        const usesStringChapterId =
            isAlternateViewerLayout() ||
            /(^|\.)lezhinx\.com$/.test(location.hostname);
        let viewerRegex;
        if (usesStringChapterId) {
            viewerRegex = /^\/viewer\/[^\/]+\/[a-zA-Z0-9_-]+\/?$/;
        } else {
            viewerRegex = /^\/viewer\/[^\/]+\/\d+\/?$/;
        }
        const chapterViewerRegex =
            /^\/comic\/[^\/]+\/(?:chapter|volume)\/[a-zA-Z0-9_-]+\/viewer\/?$/;
        const libraryViewerRegex =
            /^\/[a-z]{2}\/library\/comic\/[a-z]{2}-[A-Z]{2}\/[^\/]+\/\d+\/?$/;
        return (
            /^\/(?:[a-z]{2}\/)?comic\/[^\/]+\/[^\/]+\/?$/.test(url) ||
            chapterViewerRegex.test(url) ||
            viewerRegex.test(url) ||
            libraryViewerRegex.test(url)
        );
    }

    function hasPurchaseModal() {
        return !!document.querySelector(
            '.lzModalContainer a[href$="/payment"]'
        );
    }

    function isAlternateViewerLayout() {
        const host = location.hostname;
        return VIEWER_ALTERNATE_DOMAINS.some(d => host.endsWith(d));
    }

    function isHorizontalViewerLayout() {
        const {
            horizontalWrapper: jpWrapper
        } = RENDER_PAGE_SELECTORS_HORIZONTAL.jp;
        if (document.querySelector(jpWrapper)) {
            return 'jp';
        }
        const {
            horizontalWrapper,
            horizontalNavNext
        } = RENDER_PAGE_SELECTORS_HORIZONTAL.kr;
        if (
            document.querySelector(horizontalWrapper) &&
            document.querySelector(horizontalNavNext)
        ) {
            return 'kr';
        }
        return false;
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
                `${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION} - INITIAL RENDER METHOD: %c${type.toUpperCase()}`,
                'font-weight:bold;', {
                    images: wrapper ? wrapper.querySelectorAll('img').length : 0,
                    blobs: wrapper ? wrapper.querySelectorAll("img[src^='blob:']").length : 0,
                    canvases: wrapper ? wrapper.querySelectorAll('canvas').length : 0
                },
            );
        }
        state.viewer.type = type;
        state.viewer.detected = true;
        state.viewer.url = location.pathname;
    }

    function getViewerContainer() {
        for (const selector of VIEWER_CONTAINER_SELECTORS) {
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

    function getIndexedComicCuts({
        ensureIndex = true
    } = {}) {
        for (const selector of RENDER_PAGE_SELECTORS) {
            const cuts = [...document.querySelectorAll(selector)];
            if (!cuts.length) continue;
            if (ensureIndex) {
                const firstNative = cuts[0]?.dataset.cutIndex;
                const siteIsZeroBased =
                    firstNative !== undefined &&
                    firstNative !== '' &&
                    Number(firstNative) === 0;
                let index = 1;
                for (const cut of cuts) {
                    if (!cut.dataset.cutIndex || siteIsZeroBased) {
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
                for (const selector of UI_PAGE_SELECTORS.sliders) {
                    const el = document.querySelector(selector);
                    if (!el) continue;
                    const max =
                        el.max !== undefined ?
                        Number(el.max) :
                        Number(el.dataset?.max);
                    if (Number.isFinite(max)) {
                        return el.max !== undefined ? max + 1 : max;
                    }
                }
                return null;
            },
            () => {
                const footer = document.querySelector(
                    UI_PAGE_SELECTORS.footer
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

    function isPromoImage(image) {
        const src =
            typeof image === 'string' ?
            image :
            image?.src;
        if (!src) {
            return false;
        }
        const PROMO_IMAGE_URL_BLOCKLIST = [
            'banner', 'notice_contents', 'promotion'
        ];
        const PROMO_IMAGE_CLASS_BLOCKLIST = [
            'promotion', 'thumbnail'
        ];
        try {
            const urlMatch =
                PROMO_IMAGE_URL_BLOCKLIST.some(
                    pattern =>
                    src.includes(pattern)
                );
            const classMatch =
                image instanceof HTMLImageElement &&
                PROMO_IMAGE_CLASS_BLOCKLIST.some(
                    pattern =>
                    image.closest(
                        `[class*="${pattern}"]`
                    )
                );
            const isPromo =
                urlMatch || classMatch;
            if (
                isPromo &&
                !state.images.loggedPromoImages.has(src)
            ) {
                state.images.loggedPromoImages.add(src);
                console.debug(`${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION} - PROMO: ${src}`);
            }
            return isPromo;
        } catch {
            return false;
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
            const SINGLE_LAYOUT_LABELS = [
                '두 쪽 보기',
            ];
            if (
                !document.querySelector(
                    RENDER_PAGE_SELECTORS_HORIZONTAL.kr.horizontalWrapper
                )
            ) {
                return;
            }
            const wait = ms => new Promise(r => setTimeout(r, ms));
            const waitFor = (fn, timeout = 4000) => {
                return new Promise(resolve => {
                    const existing = fn();
                    if (existing) {
                        return resolve(existing);
                    }
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

    function createDownloadButton() {
        if (!isChapterPage()) return;
        if (document.querySelector('.download-button')) return;
        if (isMobileDevice()) {
            throwDownloadError('MOBILE_DEVICE_NOT_SUPPORTED');
            return;
        }
        const btn = document.createElement('button');
        btn.classList.add('download-button');
        btn.textContent = UI_BUTTON_LABELS.DEFAULT;
        btn.onclick = () => {
            detectRenderType();
            executeDownloadPipeline(btn);
        };
        document.body.appendChild(btn);
        const popup = document.createElement('div');
        popup.className = 'download-popup';
        popup.innerHTML = `
            <div class="download-popup-title">${UI_ICON_SET.bookmark}${SCRIPT_NAME_DEBUG}</div>
            <div class="download-popup-meta">
                <span>v${SCRIPT_VERSION}</span>
                <span class="download-popup-meta-sep">·</span>
                <a href="https://github.com/OsborneLabs/Offline"
                    target="_blank" rel="noopener noreferrer">Osborne</a>
                <span class="download-popup-meta-sep">·</span>
                <a href="https://greasyfork.org/en/scripts/568060-offline-for-lezhin"
                    target="_blank" rel="noopener noreferrer"
                    class="icon-tooltip" data-tooltip="Update">
                    ${UI_ICON_SET.update}
                </a>
                <a href="https://github.com/OsborneLabs/Offline/issues"
                    target="_blank" rel="noopener noreferrer"
                    class="icon-tooltip" data-tooltip="Submit an issue">
                    ${UI_ICON_SET.megaphone}
                </a>
                <a href="https://ko-fi.com/OsborneLabs"
                    target="_blank" rel="noopener noreferrer"
                    class="icon-tooltip" data-tooltip="Donate">
                    ${UI_ICON_SET.heart}
                </a>
            </div>
            <div class="download-popup-divider"></div>
            <div class="download-popup-sections">
                <div class="download-popup-section">
                    <div class="download-popup-section-title">Downloads</div>
                    <div class="download-popup-setting-row">
                        <div class="download-popup-setting-text">
                            <div class="download-popup-setting-label">Dim screen</div>
                            <div class="download-popup-setting-highlight">Lowers page brightness when downloading</div>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="toggle-dim-screen">
                            <span class="switch-track"></span>
                            <span class="switch-thumb"></span>
                        </label>
                    </div>
                    <div class="download-popup-setting-row">
                        <div class="download-popup-setting-text">
                            <div class="download-popup-setting-label">Small image size</div>
                            <div class="download-popup-setting-highlight">Downloads images as .webp: ~25% smaller</div>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="toggle-small-file-size">
                            <span class="switch-track"></span>
                            <span class="switch-thumb"></span>
                        </label>
                    </div>
                </div>
                <div class="download-popup-section-divider"></div>
                <div class="download-popup-section">
                    <div class="download-popup-section-title">Troubleshooting</div>
                    <div class="download-popup-setting-label">Run a diagnostic</div>
                    <div class="download-popup-setting-highlight">Simulates a chapter download and exports a debug log as a .log file</div>
                    <button class="diagnostic-button" id="button-run-diagnostic">${UI_BUTTON_LABELS.DIAG_DEFAULT}</button>
                </div>
            </div>
        `;
        document.body.appendChild(popup);
        const savedSmallFileSize = localStorage.getItem(STORAGE_KEY_SMALL_FILE_SIZE) === 'true';
        const smallFileSizeToggle = popup.querySelector('#toggle-small-file-size');
        smallFileSizeToggle.checked = savedSmallFileSize;
        smallFileSizeToggle.addEventListener('change', () => {
            localStorage.setItem(STORAGE_KEY_SMALL_FILE_SIZE, String(smallFileSizeToggle.checked));
        });
        const savedDimScreen = isDimScreenEnabled();
        const dimScreenToggle = popup.querySelector('#toggle-dim-screen');
        dimScreenToggle.checked = savedDimScreen;
        dimScreenToggle.addEventListener('change', () => {
            localStorage.setItem(STORAGE_KEY_DIM_SCREEN, String(dimScreenToggle.checked));
        });
        const diagnosticButton = popup.querySelector('#button-run-diagnostic');
        diagnosticButton.addEventListener('click', () => {
            hidePopup();
            executeDiagnosticPipeline(btn, diagnosticButton);
        });
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
            showTimer = setTimeout(showPopup, 250);
        });
        btn.addEventListener('mouseleave', () => {
            clearTimeout(showTimer);
            hideTimer = setTimeout(hidePopup, 75);
        });
        popup.addEventListener('mouseenter', () => {
            clearTimeout(hideTimer);
        });
        popup.addEventListener('mouseleave', () => {
            hideTimer = setTimeout(hidePopup, 75);
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

    function createDimOverlay() {
        if (document.querySelector('.lezhin-dim-overlay')) return;
        const overlay = document.createElement('div');
        overlay.className = 'lezhin-dim-overlay';
        document.body.appendChild(overlay);
    }

    function isDimScreenEnabled() {
        return localStorage.getItem(STORAGE_KEY_DIM_SCREEN) !== 'false';
    }

    function showDimOverlay() {
        if (!isDimScreenEnabled()) return;
        const overlay = document.querySelector('.lezhin-dim-overlay');
        if (overlay) overlay.classList.add('visible');
    }

    function hideDimOverlay() {
        const overlay = document.querySelector('.lezhin-dim-overlay');
        if (overlay) overlay.classList.remove('visible');
    }

    function lockPageInteraction() {
        document.body.classList.add('lock-site-ui');
        showDimOverlay();
    }

    function unlockPageInteraction() {
        document.body.classList.remove('lock-site-ui');
        hideDimOverlay();
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
        function getPromoCount() {
            return getIndexedComicCuts()
                .filter(cut => {
                    const img = cut.querySelector('img');
                    return isPromoImage(img);
                })
                .length;
        }
        const renderType = state.viewer.type;
        const renderTypeLabel =
            (renderType || 'UNKNOWN').toUpperCase();
        const useSmallFileSize =
            localStorage.getItem(
                STORAGE_KEY_SMALL_FILE_SIZE
            ) === 'true';
        const layout = getViewerLayoutConfig();
        const isHorizontalJpBlob =
            renderType === 'blob' &&
            isHorizontalViewerLayout() === 'jp';
        const isDeterministic =
            renderType === 'blob' &&
            (layout.pageSource === 'cuts' || isHorizontalJpBlob);
        let total, promoCount, expected;
        if (isDeterministic) {
            total = isHorizontalJpBlob ?
                (() => {
                    try {
                        return getTotalPageCount();
                    } catch {
                        return collectedCount;
                    }
                })() :
                getAllPageIndexes().length;
            promoCount = Math.max(
                0,
                total - collectedCount
            );
            expected = collectedCount;
        } else {
            try {
                total = getTotalPageCount();
            } catch {
                total = getIndexedComicCuts().length;
            }
            promoCount = getPromoCount();
            expected = total - promoCount;
        }
        console.debug(
            `${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION} - ` +
            `TOTAL IMAGES: ${total} | ` +
            `PROMO IMAGES: ${promoCount} | ` +
            (!isDeterministic ?
                `EXPECTED IMAGES: ${expected} | ` :
                '') +
            `COLLECTED IMAGES: ${collectedCount} | ` +
            `SMALL FILE SIZE: ${useSmallFileSize ? 'TRUE' : 'FALSE'} | ` +
            `FINAL RENDER METHOD: %c${renderTypeLabel}`, 'font-weight:bold;'
        );
        return collectedCount === expected;
    }

    function validateCollectedImages(session, images) {
        function filterPromoImages(images) {
            return images.filter(item => {
                if (typeof item === 'string') {
                    return !isPromoImage({
                        src: item,
                        closest: () => null
                    });
                }
                if (item instanceof HTMLImageElement) {
                    return !isPromoImage(item);
                }

                return true;
            });
        }
        if (session.cancelled) {
            throwDownloadError('DOWNLOAD_ABORTED');
        }
        if (!images || !images.length) {
            console.debug(
                `${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION} - ERROR: NO_IMAGES_COLLECTED`
            );
            throwDownloadError(
                'NO_IMAGES_COLLECTED'
            );
        }
        images = filterPromoImages(images);
        const isValidCount =
            validateCollectedPageCount(images.length);
        if (!isValidCount) {
            console.debug(
                `${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION} - ERROR: IMAGE_COUNT_MISMATCH`
            );
            throwDownloadError(
                'IMAGE_COUNT_MISMATCH'
            );
        }
        return images;
    }

    function findMissingPages(collectedMap) {
        function getExpectedComicIndexes() {
            return getIndexedComicCuts()
                .filter(cut => {
                    const img = cut.querySelector('img');
                    return !isPromoImage(img);
                })
                .map(cut =>
                    Number(cut.dataset.cutIndex)
                )
                .filter(Number.isFinite);
        }
        if (!(collectedMap instanceof Map)) {
            return [];
        }
        const collected =
            new Set(collectedMap.keys());
        const expected =
            getExpectedComicIndexes();
        return expected.filter(index =>
            !collected.has(index)
        );
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
        let previousMissingKey = null;
        const delayMs = scrollDelay;
        for (
            let attempt = 0; attempt < maxAttempts && !session.cancelled; attempt++
        ) {
            const missing = findMissingPages(collectedMap);
            if (!missing.length) {
                break;
            }
            const missingKey = missing.join(', ');
            if (missingKey === previousMissingKey) {
                break;
            }
            previousMissingKey = missingKey;
            if (beforeAttempt) {
                await beforeAttempt(missing);
            }
            for (const index of missing) {
                if (session.cancelled) {
                    break;
                }
                scrollToComicPage(index, {
                    instant: true,
                    allowLastPage: false
                });
                await new Promise(r =>
                    setTimeout(r, delayMs)
                );
                onProgress?.(collectedMap.size, null);
            }
            if (nudgeScroll) {
                window.scrollBy(0, 1);
                window.scrollBy(0, -1);
            }
            if (afterAttempt) {
                await afterAttempt(missing);
            }
            if (idleWait) {
                const isFirstRetry = attempt === 0;
                const fewMissing = missing.length <= 2;
                await waitForCanvasIdle(
                    isFirstRetry ?
                    250 :
                    (fewMissing ? 120 : 150),
                    isFirstRetry ?
                    900 :
                    (fewMissing ? 400 : 500)
                );
            }
        }
        const finalMissing = findMissingPages(collectedMap);
        return finalMissing;
    }

    async function collectWebpPages(session, onProgress) {
        const wrapper = getViewerContainer();
        if (!wrapper || session.cancelled) {
            return {
                images: [],
                switchTo: null
            };
        }
        state.ui.images.clear();
        const special = getViewerLayoutConfig();
        const cutsToUse = special.enabled ?
            special.safeCuts :
            getIndexedComicCuts();
        const stableCuts = [...cutsToUse];

        function waitForImageInjection(
            cut,
            timeout = 1500
        ) {
            return new Promise(resolve => {
                const start = performance.now();

                function check() {
                    const img = cut.querySelector('img');
                    if (
                        img &&
                        img.src &&
                        !img.src.startsWith('blob:')
                    ) {
                        return resolve(true);
                    }
                    if (
                        performance.now() - start >
                        timeout
                    ) {
                        return resolve(false);
                    }
                    requestAnimationFrame(check);
                }
                check();
            });
        }
        for (const cut of stableCuts) {
            if (
                session.cancelled ||
                state.ui.phase !== 'collecting'
            ) {
                break;
            }
            const index =
                Number(cut.dataset.cutIndex);
            if (!Number.isFinite(index)) {
                continue;
            }
            scrollToComicPage(index, {
                instant: true
            });
            await waitForImageInjection(
                cut,
                1500
            );
            const liveWrapper =
                getViewerContainer();
            if (liveWrapper) {
                if (
                    liveWrapper.querySelector(
                        'canvas'
                    )
                ) {
                    setRenderType('canvas');
                    console.log(`${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION} - RENDER METHOD OVERRIDE: WEBP → %cCANVAS`, 'font-weight:bold;');
                    return {
                        images: null,
                        switchTo: 'canvas'
                    };
                }
                if (
                    liveWrapper.querySelector("img[src^='blob:']")
                ) {
                    setRenderType('blob');
                    console.log(`${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION} - RENDER METHOD OVERRIDE: WEBP → %cBLOB`, 'font-weight:bold;');
                    return {
                        images: null,
                        switchTo: 'blob'
                    };
                }
            }
            const img = [...cut.querySelectorAll('img')]
                .find(i =>
                    i.src &&
                    !i.src.startsWith('blob:')
                );
            if (
                img &&
                !state.ui.images.has(index)
            ) {
                state.ui.images.set(
                    index,
                    img.src
                );
                onProgress(
                    state.ui.images.size
                );
            }
        }
        return {
            images: session.cancelled ? [] : getOrderedWebpPageList(),
            switchTo: null
        };
    }

    async function collectHorizontalWebpPages(session, onProgress) {
        state.ui.images.clear();
        const wrapper = document.querySelector(RENDER_PAGE_SELECTORS_HORIZONTAL.kr.horizontalWrapper);
        const sliderBtn = document.querySelector(
            '[role="slider"][data-max][data-value]'
        );
        if (!wrapper || !sliderBtn || session.cancelled) {
            console.debug(`${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION} - UI SLIDER NOT FOUND FOR HORIZONTAL LAYOUT`);
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
            if (pageIndex == null) return;
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

    async function convertCanvasPage(page, mimeType = 'image/png', quality = undefined) {
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
            }, mimeType, quality);
        });
    }

    async function streamCanvasImagesToZip(session, pages, zip, onProgress, useSmallFileSize = false) {
        const total = pages.length;
        let completed = 0;
        onProgress(0, total);
        const workerCount = getOptimalWorkerCount();
        const mimeType = useSmallFileSize ? 'image/webp' : 'image/png';
        const ext = useSmallFileSize ? 'webp' : 'png';
        await taskQueue(workerCount, pages, async (page, index) => {
            if (session.cancelled) return;
            const imgData = await convertCanvasPage(page, mimeType);
            if (!imgData || session.cancelled) return;
            const name = generateImageFileName(index + 1, total, ext);
            const file = new fflate.ZipDeflate(name, {
                level: 6
            });
            zip.add(file);
            file.push(imgData, true);
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
                if (!img || !img.complete) return;
                state.blob.pages.set(index, img);
                console.debug(`${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION} - BLOB IMAGE COLLECTED: ${index}`);
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

    async function collectBlobPages(
        session,
        onProgress,
        expectedCount = null
    ) {
        function formatPageRanges(pages) {
            if (!pages.length) return '';
            const sorted = [...pages].sort((a, b) => a - b);
            const ranges = [];
            let start = sorted[0];
            let end = sorted[0];
            for (let i = 1; i < sorted.length; i++) {
                if (sorted[i] === end + 1) {
                    end = sorted[i];
                } else {
                    ranges.push(start === end ? `${start}` : `${start}-${end}`);
                    start = end = sorted[i];
                }
            }
            ranges.push(start === end ? `${start}` : `${start}-${end}`);
            return ranges.join(', ');
        }
        async function collectBlobPagesDeterministic() {
            const WAIT_AFTER_SCROLL_MS = 250;
            const STALL_TIMEOUT_MS = 1500;
            const collected = new Map();
            const layout = getViewerLayoutConfig();
            let lastCount = 0;
            let lastProgressTs = performance.now();

            function getPageContainers() {
                for (const selector of RENDER_PAGE_SELECTORS) {
                    const nodes =
                        document.querySelectorAll(
                            selector
                        );
                    if (nodes.length) {
                        return nodes;
                    }
                }
                return [];
            }

            function extractHydratedBlobs(
                containers
            ) {
                const results = [];
                containers.forEach((el, i) => {
                    const img = el.querySelector(
                        'img[src^="blob:"]'
                    );
                    if (!img) return;
                    if (!img.complete) return;
                    results.push({
                        index: i + 1,
                        img
                    });
                });
                return results;
            }

            function scrollToFirstMissing(
                totalContainers
            ) {
                const allIndexes = [
                    ...Array(totalContainers).keys()
                ].map(i => i + 1);
                const firstMissing =
                    allIndexes.find(
                        i => !collected.has(i)
                    );
                if (firstMissing == null) {
                    return;
                }
                const isLast =
                    firstMissing >= totalContainers;
                if (
                    layout.scroll
                    .preventLastScroll &&
                    isLast
                ) {
                    return;
                }
                scrollToComicPage(
                    firstMissing, {
                        instant: true,
                        allowLastPage:
                            !layout.scroll
                            .preventLastScroll
                    }
                );
            }
            while (!session.cancelled) {
                const containers =
                    getPageContainers();
                const totalContainers =
                    containers.length;
                const blobs =
                    extractHydratedBlobs(
                        containers
                    );
                blobs.forEach(
                    ({
                        index,
                        img
                    }) => {
                        if (
                            !collected.has(index)
                        ) {
                            collected.set(
                                index,
                                img
                            );
                        }
                    }
                );
                onProgress?.(collected.size);
                if (
                    totalContainers > 0 &&
                    collected.size >=
                    totalContainers
                ) {
                    break;
                }
                if (
                    collected.size ===
                    lastCount
                ) {
                    if (
                        performance.now() -
                        lastProgressTs >
                        STALL_TIMEOUT_MS
                    ) {
                        console.warn(
                            `${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION} - ` +
                            `BLOB COLLECTION STALLED AT ` +
                            `${collected.size}/${totalContainers}`
                        );
                        break;
                    }
                } else {
                    lastProgressTs =
                        performance.now();
                    lastCount =
                        collected.size;
                }
                if (
                    collected.size <
                    totalContainers
                ) {
                    scrollToFirstMissing(
                        totalContainers
                    );
                    await new Promise(r =>
                        setTimeout(
                            r,
                            WAIT_AFTER_SCROLL_MS
                        )
                    );
                }
            }
            return collected;
        }
        const collected =
            await collectBlobPagesDeterministic();
        for (const [
                index,
                img
            ] of collected.entries()) {
            if (
                !state.blob.pages.has(index)
            ) {
                state.blob.pages.set(
                    index,
                    img
                );
            }
        }
        const BLOB_RETRY_ATTEMPTS = 4;
        let previousMissingKey = null;
        for (
            let attempt = 0; attempt <
            BLOB_RETRY_ATTEMPTS &&
            !session.cancelled; attempt++
        ) {
            const missing =
                findMissingPages(
                    state.blob.pages
                );
            if (!missing.length) {
                break;
            }
            const missingKey =
                formatPageRanges(missing);
            console.debug(
                `${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION} - ` +
                `RETRYING PAGE POSITIONS: ${missingKey}`
            );
            if (
                missingKey ===
                previousMissingKey
            ) {
                console.warn(
                    `${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION} - ` +
                    `BLOB RETRY STALLED. REMAINING PAGE POSITIONS: ${missingKey}`
                );
                break;
            }
            previousMissingKey =
                missingKey;
            for (const index of missing) {
                if (
                    session.cancelled
                ) {
                    break;
                }
                scrollToComicPage(index, {
                    instant: true,
                    allowLastPage: false
                });
                await new Promise(r =>
                    setTimeout(r, 750)
                );
                const containers =
                    (() => {
                        for (const sel of RENDER_PAGE_SELECTORS) {
                            const nodes =
                                document.querySelectorAll(
                                    sel
                                );
                            if (
                                nodes.length
                            ) {
                                return nodes;
                            }
                        }
                        return [];
                    })();
                containers.forEach(
                    (el, i) => {
                        const idx = i + 1;
                        if (
                            state.blob.pages.has(
                                idx
                            )
                        ) {
                            return;
                        }
                        const img =
                            el.querySelector(
                                'img[src^="blob:"]'
                            );
                        if (
                            img &&
                            img.complete
                        ) {
                            state.blob.pages.set(
                                idx,
                                img
                            );
                            console.debug(
                                `${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION} - ` +
                                `RECOVERED MISSING BLOB: ${idx}`
                            );
                            onProgress?.(
                                state.blob.pages
                                .size
                            );
                        }
                    }
                );
            }
        }
        const finalMissing =
            findMissingPages(
                state.blob.pages
            );
        if (finalMissing.length) {
            console.warn(
                `${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION} - ` +
                `BLOB RETRIES EXHAUSTED. MISSING PAGE POSITIONS: ` +
                formatPageRanges(
                    finalMissing
                )
            );
        }
        return state.blob.pages;
    }

    async function collectHorizontalBlobPages(session, onProgress, existing = new Map()) {
        const footerSelector = UI_PAGE_SELECTORS.footer;
        const spreadSelector = RENDER_PAGE_SELECTORS_HORIZONTAL.jp.spread;
        const wrapperSelector = RENDER_PAGE_SELECTORS_HORIZONTAL.jp.horizontalWrapper;
        let cachedPage = null;

        function getFooterPageNumbers() {
            const footer = document.querySelector(footerSelector);
            if (!footer) return null;
            const spans = footer.querySelectorAll('span');
            let current = null;
            let total = null;
            for (let i = 0; i < spans.length; i++) {
                const n = Number(spans[i].textContent.trim());
                if (!Number.isFinite(n) || n <= 0) continue;
                if (current === null) current = n;
                else {
                    total = n;
                    break;
                }
            }
            if (current !== null && total !== null) {
                return {
                    current,
                    total
                };
            }
            return null;
        }

        function updateCachedPage() {
            const data = getFooterPageNumbers();
            if (data) cachedPage = data.current;
            return cachedPage;
        }
        const getCurrentPageNumber = () => cachedPage ?? updateCachedPage();
        const getTotalPages = () =>
            getFooterPageNumbers()?.total ?? getTotalPageCount();

        function dispatchArrowKey(key) {
            document.dispatchEvent(
                new KeyboardEvent('keydown', {
                    key,
                    code: key,
                    bubbles: true,
                    cancelable: true
                })
            );
        }

        function getActiveSpread() {
            const spreads = document.querySelectorAll(spreadSelector);
            for (const s of spreads) {
                const r = s.style.right;
                if (r === '0%' || r === '0px' || r === '') return s;
            }
            return spreads[0] || null;
        }

        function getActiveImage(spreadEl) {
            return spreadEl?.querySelector('img[src^="blob:"]') || null;
        }

        function waitForPageChange(prev, timeout = 3000) {
            return new Promise(resolve => {
                const start = performance.now();

                function tick() {
                    if (session.cancelled) return resolve(false);
                    const current = updateCachedPage();
                    if (current !== null && current !== prev) {
                        return resolve(true);
                    }
                    if (performance.now() - start > timeout) {
                        return resolve(false);
                    }
                    requestAnimationFrame(tick);
                }
                tick();
            });
        }

        function waitForImage(spreadEl, timeout = 3000) {
            return new Promise(resolve => {
                const start = performance.now();

                function tick() {
                    const img = getActiveImage(spreadEl);
                    if (
                        img &&
                        img.src.startsWith('blob:') &&
                        img.complete &&
                        img.naturalWidth > 0
                    ) {
                        return resolve(img);
                    }
                    if (performance.now() - start > timeout) {
                        return resolve(null);
                    }
                    requestAnimationFrame(tick);
                }
                tick();
            });
        }
        const wrapper = document.querySelector(wrapperSelector);
        if (!wrapper || session.cancelled) return new Map();
        const total = getTotalPages();
        const result = new Array(total);
        const seenSrcs = new Set();
        for (const [index, img] of existing.entries()) {
            result[index - 1] = img;
            seenSrcs.add(img.src);
        }
        updateCachedPage();
        let guard = 0;
        while (guard < total + 5 && !session.cancelled) {
            const current = getCurrentPageNumber();
            if (current === 1) break;
            dispatchArrowKey('ArrowRight');
            await waitForPageChange(current, 1500);
            guard++;
        }
        await new Promise(r => setTimeout(r, 300));
        for (let pageNum = 1; pageNum <= total; pageNum++) {
            if (session.cancelled) break;
            if (result[pageNum - 1]) continue;
            let spreadEl = getActiveSpread();
            let img = null;
            const MAX_RETRIES = 4;
            for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
                img = await waitForImage(spreadEl, 3000);
                if (img) break;
                await new Promise(r => setTimeout(r, 250));
                spreadEl = getActiveSpread();
            }
            if (!img) {
                console.warn(`${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION} - FAILED TO COLLECT PAGE ${pageNum}`);
                continue;
            }
            if (!seenSrcs.has(img.src)) {
                seenSrcs.add(img.src);
                result[pageNum - 1] = img;
                onProgress(seenSrcs.size);
            }
            if (pageNum >= total) break;
            const prev = getCurrentPageNumber();
            dispatchArrowKey('ArrowLeft');
            await waitForPageChange(prev, 3000);
        }
        const map = new Map();
        result.forEach((img, i) => {
            if (img) map.set(i + 1, img);
        });
        return map;
    }

    function getOrderedBlobPageList(blobMap) {
        return [...blobMap.entries()]
            .sort(([a], [b]) => a - b)
            .map(([, img]) => img);
    }

    async function convertBlobImage(img, mimeType = 'image/png', quality = undefined) {
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
            }, mimeType, quality);
        });
    }

    async function buildBlobImageFiles(session, images, onProgress, useSmallFileSize = false) {
        const files = {};
        const total = images.length;
        onProgress(0, total);
        const workerCount = getOptimalWorkerCount();
        let completed = 0;
        const mimeType = useSmallFileSize ? 'image/webp' : 'image/png';
        const ext = useSmallFileSize ? 'webp' : 'png';
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
                const imgData = await convertBlobImage(img, mimeType);
                if (session.cancelled) return null;
                completed++;
                onProgress(completed, total);
                return {
                    name: generateImageFileName(index + 1, total, ext),
                    data: imgData
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
                console.debug(`${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION}: ZIP STREAMING ERROR\n`, err);
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
                    console.debug(`${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION}: ZIP FINALIZING ERROR\n`, e);
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
        let workers = Math.floor(cores / 2);
        if (memory <= 2) workers = 2;
        else if (memory <= 4) workers = Math.min(workers, 3);
        if (isMobileDevice()) workers = Math.min(workers, 3);
        return Math.max(2, Math.min(6, workers));
    }

    async function taskQueue(limit, items, worker) {
        const results = [];
        const executing = [];
        for (let i = 0; i < items.length; i++) {
            const p = Promise.resolve().then(() => worker(items[i], i));
            results.push(p);
            if (limit <= items.length) {
                const e = p.then(() => executing.splice(executing.indexOf(e), 1));
                executing.push(e);
                if (executing.length >= limit) await Promise.race(executing);
            }
        }
        return Promise.all(results);
    }

    function getImageData(url) {
        return new Promise((resolve, reject) => {
            function fail(type, details = null) {
                if (details) {
                    console.debug(`${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION} - ${type}`, details);
                }
                switch (type) {
                    case 'HTTP_401':
                    case 'HTTP_403':
                        return reject(new Error(
                            DOWNLOAD_ERROR_MAP.IMAGE_ACCESS_DENIED.code
                        ));
                    case 'REQUEST_TIMEOUT':
                        return reject(new Error(
                            DOWNLOAD_ERROR_MAP.REQUEST_TIMEOUT.code
                        ));
                    case 'NETWORK_ERROR':
                        return reject(new Error(
                            DOWNLOAD_ERROR_MAP.NETWORK_ERROR.code
                        ));
                    default:
                        return reject(new Error(
                            DOWNLOAD_ERROR_MAP.IMAGE_REQUEST_FAILED.code
                        ));
                }
            }
            GM_xmlhttpRequest({
                method: 'GET',
                url,
                responseType: 'arraybuffer',
                headers: {
                    Referer: `${location.origin}/`
                },
                timeout: 30000,
                onload: response => {
                    const {
                        status,
                        response: data
                    } = response;
                    if (
                        status >= 200 &&
                        status < 300 &&
                        data
                    ) {
                        resolve(new Uint8Array(data));
                        return;
                    }
                    fail(`HTTP_${status || 'UNKNOWN'}`, {
                        status,
                        url
                    });
                },
                onerror: error => {
                    fail('NETWORK_ERROR', {
                        url,
                        error
                    });
                },
                ontimeout: () => {
                    fail('REQUEST_TIMEOUT', url);
                }
            });
        });
    }

    async function executeDiagnosticPipeline(mainBtn, diagBtn) {
        if (state.ui.isDownloading) return;
        state.ui.isDownloading = true;
        mainBtn.disabled = true;
        mainBtn.textContent = UI_BUTTON_LABELS.DIAGNOSING;
        diagBtn.disabled = true;
        diagBtn.textContent = UI_BUTTON_LABELS.DIAGNOSING;
        const diagLogs = [];
        const diagStart = new Date();
        const boolStr = v => v ? 'TRUE' : 'FALSE';
        const originals = {};
        ['log', 'debug', 'warn', 'error'].forEach(level => {
            originals[level] = console[level].bind(console);
            console[level] = function(...args) {
                originals[level](...args);
                const firstArg = typeof args[0] === 'string' ? args[0] : '';
                if (!firstArg.includes(SCRIPT_NAME_DEBUG)) return;
                const ts = new Date().toISOString().replace('T', ' ').slice(0, 23);
                let fmt = firstArg;
                const rest = args.slice(1);
                const styleArgs = [];
                fmt = fmt.replace(/%c/g, () => {
                    styleArgs.push(rest.shift());
                    return '';
                });
                const extras = rest.map(a => {
                    if (typeof a === 'string') return a;
                    try {
                        return JSON.stringify(a);
                    } catch {
                        return String(a);
                    }
                });
                const full = [fmt, ...extras].join(' ').trim();
                const cleaned = full.replace(
                    new RegExp(`${SCRIPT_NAME_DEBUG} v[\\d.]+ - `, 'g'), ''
                );
                diagLogs.push(`[${ts}] ${cleaned}`);
            };
        });
        const restoreConsole = () => {
            ['log', 'debug', 'warn', 'error'].forEach(level => {
                console[level] = originals[level];
            });
        };
        let viewerContainerMatched = 'NOT FOUND';
        let totalPageCount = 'N/A';
        let missingAfterScroll = [];
        let didFail = false;
        let caughtError = null;
        let errorMessage = '';
        try {
            const session = startDownloadSession();
            state.ui.activeDownload = session;
            state.ui.phase = 'collecting';
            lockPageScroll();
            lockPageInteraction();
            scrollToTop();
            await new Promise(r => setTimeout(r, 300));
            state.viewer.initialRenderingLogged = false;
            const renderType = resolveRenderType();
            if (renderType === 'webp') {
                const result = isHorizontalViewerLayout() === 'kr' ? {
                        images: await collectHorizontalWebpPages(session, () => {}),
                        switchTo: null
                    } :
                    await collectWebpPages(session, () => {});
                if (!result.switchTo) {
                    await retryMissingPages(session, state.ui.images, () => {});
                    missingAfterScroll = findMissingPages(state.ui.images);
                }
            } else if (renderType === 'canvas') {
                await collectCanvasPages(session, () => {});
                missingAfterScroll = findMissingPages(state.canvas.pages);
            } else if (renderType === 'blob') {
                if (isHorizontalViewerLayout() === 'jp') {
                    const collected = await collectHorizontalBlobPages(session, () => {}, new Map(state.blob.pages));
                    missingAfterScroll = findMissingPages(collected);
                } else {
                    const layout = getViewerLayoutConfig();
                    const expectedCount = layout.pageSource === 'cuts' ?
                        getAllPageIndexes().length :
                        getTotalPageCount();
                    await collectBlobPages(session, () => {}, expectedCount);
                    missingAfterScroll = findMissingPages(state.blob.pages);
                }
            }
            restoreConsole();
            viewerContainerMatched = VIEWER_CONTAINER_SELECTORS.find(s => document.querySelector(s)) || 'NOT FOUND';
            try {
                totalPageCount = String(getTotalPageCount());
            } catch {}
        } catch (e) {
            restoreConsole();
            didFail = true;
            caughtError = e;
            errorMessage = (e?.message && DOWNLOAD_ERROR_INDEX[e.message]) ?
                DOWNLOAD_ERROR_INDEX[e.message].message :
                (e?.message || String(e));
        }
        const ts = diagStart.toISOString().replace('T', ' ').slice(0, 23);
        const lines = [
            `--- GENERATED ${ts} ---`,
            '',
            `SCRIPT_NAME: ${SCRIPT_NAME_DEBUG}`,
            `SCRIPT_VERSION: v${SCRIPT_VERSION}`,
            'USER_AGENT: ' + navigator.userAgent,
            'CHAPTER_URL: ' + location.href,
            '',
            '-- INITIAL DIAGNOSIS --',
            '',
            `Chapter Page: ${boolStr(isChapterPage())}`,
            `Purchase Modal: ${boolStr(hasPurchaseModal())}`,
            `Alternate Layout: ${boolStr(isAlternateViewerLayout())}`,
            `Horizontal Layout: ${isHorizontalViewerLayout() || 'FALSE'}`,
            `Mobile Device: ${boolStr(IS_MOBILE_DEVICE)}`,
            `Render Type: ${(state.viewer.type || 'NULL').toUpperCase()}`,
            '',
            `getViewerContainer: { ${viewerContainerMatched} }`,
            `getTotalPageCount: { ${totalPageCount} }`,
            `getSeriesTitle: { ${getSeriesTitle()} }`,
            `getSeriesChapter: { ${getSeriesChapter()} }`,
            '',
            `Footer Element Present: ${boolStr(!!document.querySelector(UI_PAGE_SELECTORS.footer))}`,
            `Missing Indexes on Scroll: ${missingAfterScroll.length ? missingAfterScroll.join(', ') : 'NONE'}`,
            `Refresh Key Present: ${boolStr(!!sessionStorage.getItem(STORAGE_KEY_AUTO_REFRESH))}`,
            `Canvas Hook Active: ${boolStr(!!CanvasRenderingContext2D.prototype.__lezhinHooked)}`,
            '',
            '-- DEVELOPER CONSOLE --',
            '',
            ...diagLogs,
            '',
            '-- SUMMARY RESULTS --',
            '',
            didFail ?
            'OVERALL: FAIL' :
            `OVERALL: ${missingAfterScroll.length === 0 ? 'PASS' : `PARTIAL (missing: ${missingAfterScroll.join(', ')})`}`,
            ...(didFail ? [`Error: ${errorMessage}`] : []),
            ''
        ];
        try {
            const blob = new Blob([lines.join('\n')], {
                type: 'text/plain'
            });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'Offline-Lezhin-Debug.log';
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
        } catch {}
        if (didFail) {
            handleDownloadError(caughtError);
            diagBtn.textContent = UI_BUTTON_LABELS.DIAG_DEFAULT;
            diagBtn.disabled = false;
            mainBtn.textContent = UI_BUTTON_LABELS.DEFAULT;
            mainBtn.disabled = false;
        } else {
            mainBtn.textContent = UI_BUTTON_LABELS.DEFAULT;
            diagBtn.textContent = UI_BUTTON_LABELS.COMPLETE;
            sessionStorage.setItem(STORAGE_KEY_AUTO_REFRESH, '1');
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
            setTimeout(() => location.reload(), 700);
        }
        state.ui.phase = 'idle';
        state.ui.isDownloading = false;
        if (state.ui.activeDownload) state.ui.activeDownload = null;
        unlockPageScroll();
        unlockPageInteraction();
    }

    async function executeDownloadPipeline(btn) {
        if (state.ui.isDownloading) return;
        const renderType = resolveRenderType();
        if (!renderType) return;
        const useSmallFileSize = localStorage.getItem(STORAGE_KEY_SMALL_FILE_SIZE) === 'true';
        state.ui.isDownloading = true;
        state.ui.phase = 'collecting';
        const session = startDownloadSession();
        state.ui.activeDownload = session;
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
                const result = isHorizontalViewerLayout() === 'kr' ? {
                        images: await collectHorizontalWebpPages(session, onCollect),
                        switchTo: null
                    } :
                    await collectWebpPages(session, onCollect);
                if (result.switchTo === 'canvas') {
                    state.canvas.pages = new Map(state.canvas.buffer);
                    state.canvas.buffer.clear();
                    state.canvas.enabled = true;
                    const cuts = getIndexedComicCuts();
                    const total = cuts.length;
                    for (const cut of cuts) {
                        if (session.cancelled) break;
                        scrollToComicPage(Number(cut.dataset.cutIndex), {
                            instant: true
                        });
                        await new Promise(r => setTimeout(r, 300));
                        onCollect(state.canvas.pages.size, total);
                    }
                    state.canvas.enabled = false;
                    await retryMissingPages(session, state.canvas.pages, onCollect, {
                        beforeAttempt: async () => {
                            state.canvas.enabled = true;
                        },
                        afterAttempt: async () => {
                            state.canvas.enabled = false;
                        },
                        idleWait: true,
                        nudgeScroll: true
                    });
                    const canvasPages = [...state.canvas.pages.values()]
                        .filter(p => p.ops.length)
                        .sort((a, b) => a.pageIndex - b.pageIndex);
                    const validCanvasPages = validateCollectedImages(session, canvasPages);
                    state.ui.phase = 'downloading';
                    const {
                        zip: cZip,
                        donePromise: cDone
                    } = createZipInstance();
                    const success = await streamCanvasImagesToZip(session, validCanvasPages, cZip, onConvert, useSmallFileSize);
                    if (!success) throwDownloadError('DOWNLOAD_ABORTED');
                    await finalizeZip(cZip, cDone);
                    completed = true;
                } else if (result.switchTo === 'blob') {
                    state.blob.enabled = true;
                    const layout = getViewerLayoutConfig();
                    const expectedCount = layout.pageSource === 'cuts' ?
                        getAllPageIndexes().length :
                        getTotalPageCount();
                    await collectBlobPages(session, onCollect, expectedCount);
                    state.blob.enabled = false;
                    const orderedBlobImages = validateCollectedImages(session, getOrderedBlobPageList(state.blob.pages));
                    state.ui.phase = 'downloading';
                    files = await buildBlobImageFiles(session, orderedBlobImages, onConvert, useSmallFileSize);
                } else {
                    const images = result.images;
                    validateCollectedImages(session, images);
                    await retryMissingPages(session, state.ui.images, onCollect);
                    const finalImages = validateCollectedImages(session, getOrderedWebpPageList());
                    state.ui.phase = 'downloading';
                    if (useSmallFileSize) {
                        files = {};
                        const total = finalImages.length;
                        let completedWebp = 0;
                        onConvert(0, total);
                        const workerCount = getOptimalWorkerCount();
                        const jobs = finalImages.map((url, index) => ({
                            url,
                            index
                        }));
                        const results = await taskQueue(workerCount, jobs, async ({
                            url,
                            index
                        }) => {
                            if (session.cancelled) return null;
                            const data = await getImageData(url);
                            if (session.cancelled) return null;
                            completedWebp++;
                            onConvert(completedWebp, total);
                            return {
                                name: generateImageFileName(index + 1, total, 'webp'),
                                data
                            };
                        });
                        for (const r of results) {
                            if (r) files[r.name] = r.data;
                        }
                    } else {
                        files = await convertWebpPagesToJpeg(session, finalImages, onConvert);
                    }
                }
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
                        onConvert,
                        useSmallFileSize
                    );
                if (!success) {
                    throwDownloadError('DOWNLOAD_ABORTED');
                }
                await finalizeZip(zip, donePromise);
            }
            if (renderType === 'blob') {
                if (isHorizontalViewerLayout() === 'jp') {
                    const preloaded = new Map(state.blob.pages);
                    const collected = await collectHorizontalBlobPages(
                        session,
                        onCollect,
                        preloaded
                    );
                    for (const [index, img] of collected.entries()) {
                        preloaded.set(index, img);
                    }
                    const orderedImages = validateCollectedImages(
                        session,
                        getOrderedBlobPageList(preloaded)
                    );
                    state.ui.phase = 'downloading';
                    files = await buildBlobImageFiles(
                        session,
                        orderedImages,
                        onConvert,
                        useSmallFileSize
                    );
                } else {
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
                            onCollect,
                            expectedCount
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
                        onConvert,
                        useSmallFileSize
                    );
                }
            }
            if (!completed && renderType !== 'canvas') {
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
            if (
                completed &&
                !sessionStorage.getItem(
                    STORAGE_KEY_AUTO_REFRESH
                )
            ) {
                sessionStorage.setItem(
                    STORAGE_KEY_AUTO_REFRESH,
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

    function disableSiteTelemetry() {
        disableSiteTelemetryNetworkRequests();
    }

    function disableSiteTelemetryNetworkRequests() {
        if (window.__disableTelemetryNetworkRequests) return;
        window.__disableTelemetryNetworkRequests = true;
        const TELEMETRY_NETWORK_DOMAINS = [
            "bizspring.net", "clarity.ms", "creativecdn.com", "criteo.com", "doubleclick.net", "eskimi.com",
            "googletagmanager.com", "nestads.com"
        ];
        const TELEMETRY_NETWORK_SUBDOMAINS = [
            "ad.daum.net", "aem-kakao-collector.onkakao.net", "analytics.google.com", "analytics.tiktok.com",
            "analytics.twitter.com", "web-sdk-cdn.singular.net",
        ];
        const loggedDomains = new Set();

        function getHostname(url) {
            try {
                return new URL(url).hostname;
            } catch {
                return null;
            }
        }

        function shouldBlock(host) {
            if (!host) return false;
            if (TELEMETRY_NETWORK_SUBDOMAINS.includes(host)) return true;
            return TELEMETRY_NETWORK_DOMAINS.some(domain =>
                host === domain || host.endsWith("." + domain)
            );
        }

        function logOnce(host, url) {
            if (!host || loggedDomains.has(host)) return;
            console.debug(`${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION} - TELEMETRY REQUEST BLOCKED:`, url);
            loggedDomains.add(host);
        }

        function handleBlock(url, type) {
            const host = getHostname(url);
            if (shouldBlock(host)) {
                logOnce(host, url);
                throw new Error(`blocked-${type}`);
            }
            return false;
        }
        const origFetch = window.fetch;
        if (origFetch) {
            window.fetch = function(resource) {
                const url = typeof resource === 'string' ?
                    resource :
                    resource && resource.url;
                try {
                    handleBlock(url, 'fetch');
                } catch (e) {
                    return Promise.reject(new TypeError('blocked-request'));
                }
                return origFetch.apply(this, arguments);
            };
        }
        const origOpen = XMLHttpRequest.prototype.open;
        const origSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.open = function(method, url) {
            const host = getHostname(url);
            if (shouldBlock(host)) {
                this.__blocked = true;
                this.__url = url;
                this.__host = host;
            }
            return origOpen.apply(this, arguments);
        };
        XMLHttpRequest.prototype.send = function() {
            if (this.__blocked) {
                logOnce(this.__host, this.__url);
                this.abort();
                return;
            }
            return origSend.apply(this, arguments);
        };
        if (navigator.sendBeacon) {
            const origBeacon = navigator.sendBeacon;
            navigator.sendBeacon = function(url, data) {
                const host = getHostname(url);
                if (shouldBlock(host)) {
                    logOnce(host, url);
                    return true;
                }
                return origBeacon.apply(this, arguments);
            };
        }
        if (window.WebSocket) {
            const OrigWebSocket = window.WebSocket;
            window.WebSocket = function(url, protocols) {
                handleBlock(url, 'websocket');
                return new OrigWebSocket(url, protocols);
            };
            window.WebSocket.prototype = OrigWebSocket.prototype;
        }
        if (window.EventSource) {
            const OrigEventSource = window.EventSource;
            window.EventSource = function(url, config) {
                handleBlock(url, 'eventsource');
                return new OrigEventSource(url, config);
            };
            window.EventSource.prototype = OrigEventSource.prototype;
        }
    }

    function createToastContainer() {
        if (document.getElementById('lezhin-toast-container')) return;
        const container = document.createElement('div');
        container.id = 'lezhin-toast-container';
        document.body.appendChild(container);
    }

    function getToastDuration(severity = 'normal') {
        return (
            UI_TOAST_DURATION_BY_SEVERITY[severity] ||
            UI_TOAST_DURATION_BY_SEVERITY.normal
        );
    }

    function showToast(message, severity = 'normal') {
        createToastContainer();
        const toast = document.createElement('button');
        toast.type = 'button';
        toast.className = 'lezhin-toast';
        toast.setAttribute('aria-label', 'Dismiss');
        toast.innerHTML =
            `<span class="lezhin-toast-text"></span>` +
            `<span class="lezhin-toast-icon">${UI_ICON_SET.trash}</span>`;
        toast.querySelector('.lezhin-toast-text').textContent = message;
        toast.onclick = () => closeToast(toast);
        document
            .getElementById('lezhin-toast-container')
            .appendChild(toast);

        setTimeout(() => {
            closeToast(toast);
        }, getToastDuration(severity));
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

    function showErrorMessage(message, severity = 'normal') {
        showToast(message, severity);
    }

    function throwDownloadError(error) {
        if (error instanceof Error) {
            if (DOWNLOAD_ERROR_INDEX[error.message]) throw error;
            throw new Error(DOWNLOAD_ERROR_MAP.UNKNOWN_ERROR.code);
        }
        if (error?.code) throw new Error(error.code);
        if (typeof error === 'string' && DOWNLOAD_ERROR_MAP[error]) {
            throw new Error(DOWNLOAD_ERROR_MAP[error].code);
        }
        if (typeof error === 'string' && DOWNLOAD_ERROR_INDEX[error]) throw new Error(error);
        throw new Error(DOWNLOAD_ERROR_MAP.UNKNOWN_ERROR.code);
    }

    function handleDownloadError(error) {
        const known = DOWNLOAD_ERROR_INDEX[error?.message];
        if (known) {
            showErrorMessage(
                known.message,
                known.severity
            );
            return;
        }
        console.debug(`${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION}: DOWNLOAD ERROR OCCURRED, SEE CONSOLE BELOW\n`, error);
        showErrorMessage(
            DOWNLOAD_ERROR_MAP.UNKNOWN_ERROR.message,
            DOWNLOAD_ERROR_MAP.UNKNOWN_ERROR.severity
        );
    }

    window.addEventListener('load', init);

})();