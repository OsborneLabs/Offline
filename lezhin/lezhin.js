// ==UserScript==
// @name         Offline for Lezhin
// @namespace    https://github.com/OsborneLabs
// @version      3.1.3
// @description  Downloads and saves Lezhin chapter images to a PDF or ZIP file for offline reading
// @author       Osborne Labs
// @license      GPL-3.0-only
// @homepageURL  https://github.com/OsborneLabs/Offline
// @icon         data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4KPHN2ZyB2ZXJzaW9uPSIxLjEiIGlkPSJMYXllcl8xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCIgdmlld0JveD0iMCAwIDQ4IDQ4IiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA0OCA0ODsiIHhtbDpzcGFjZT0icHJlc2VydmUiPgogIDxzdHlsZSB0eXBlPSJ0ZXh0L2NzcyI+CiAgICAuc3QwIHsKICAgICAgZmlsbDogI0VEMUMyNDsKICAgIH0KICAgIC5zdDEgewogICAgICBmaWxsOiAjRkZGRkZGOwogICAgfQogIDwvc3R5bGU+CiAgPGc+CiAgICA8Zz4KICAgICAgPHJlY3QgY2xhc3M9InN0MCIgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiAvPgogICAgPC9nPgogICAgPGc+CiAgICAgIDxwb2x5Z29uIGNsYXNzPSJzdDEiIHBvaW50cz0iMTIuNSwxMC42IDIxLjMsMTUuMyAzMC4zLDEwLjYgMzAuMywyNS45IDM3LjMsMjUuOSAzNy4zLDM3LjMgMTIuNSwzNy4zIAkJIiAvPgogICAgICA8cmVjdCB4PSIxNi41IiB5PSIyMyIgd2lkdGg9IjMiIGhlaWdodD0iMyIgLz4KICAgICAgPHJlY3QgeD0iMjMuNSIgeT0iMjMiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIC8+CiAgICAgIDxyZWN0IHg9IjM0LjMiIHk9IjI1LjkiIHdpZHRoPSIzIiBoZWlnaHQ9IjMiIC8+CiAgICAgIDxyZWN0IHg9IjMxLjgiIHk9IjMzIiB3aWR0aD0iNS42IiBoZWlnaHQ9IjEuMyIgLz4KICAgIDwvZz4KICA8L2c+Cjwvc3ZnPg==
// @match        https://*.lezhinus.com/*
// @match        https://*.lezhin.com/*
// @match        https://*.lezhin.es/*
// @match        https://*.lezhin.jp/*
// @match        https://*.lezhincomics.com/*
// @match        https://*.lezhinde.com/*
// @match        https://*.lezhinfr.com/*
// @match        https://*.lezhinth.com/*
// @match        https://*.lezhinx.com/*
// @match        https://*.beltoon.com/*
// @match        https://*.beltoon.jp/*
// @match        https://*.bomtoon.co.kr/*
// @match        https://*.bomtoon.com/*
// @match        https://*.bomtoon.tw/*
// @match        https://*.boomtoon.com/*
// @match        https://*.delitoon.com/*
// @match        https://*.delitoon.de/*
// @match        https://*.delitoonb.de/*
// @match        https://*.delitoonme.com/*
// @match        https://*.delitoonx.com/*
// @run-at       document-start
// @connect      ccdn.lezhin.com
// @connect      rcdn.lezhin.com
// @supportURL   https://github.com/OsborneLabs/Offline/issues
// @require      https://cdn.jsdelivr.net/npm/fflate@0.8/umd/index.min.js
// @require      https://cdn.jsdelivr.net/npm/pdf-lib@1.17/dist/pdf-lib.min.js
// @downloadURL  https://update.greasyfork.org/scripts/568060/Offline%20for%20Lezhin.user.js
// @updateURL    https://update.greasyfork.org/scripts/568060/Offline%20for%20Lezhin.meta.js
// @grant        GM_xmlhttpRequest
// ==/UserScript==

/* jshint esversion: 11 */
/* global fflate, PDFLib */

(() => {
    'use strict';

    const SCRIPT_NAME_DEBUG = "OFFLINE FOR LEZHIN";
    const SCRIPT_VERSION = typeof GM_info !== 'undefined' ? GM_info.script.version : 'Unknown';
    const STORAGE_KEY_AUTO_REFRESH = 'autoRefresh';
    const STORAGE_KEY_WEBP_QUALITY = 'webp-quality';
    const usesBrowserWebpQuality = () => localStorage.getItem(STORAGE_KEY_WEBP_QUALITY) === 'browser-default';
    const STORAGE_KEY_SMALL_FILE_SIZE = 'small-file-size';
    const STORAGE_KEY_SAVE_AS_PDF = 'save-as-pdf';
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
        CONVERTING: (c, t) => t && c >= t - 1 ? UI_BUTTON_LABELS.FINISHING : c === 0 ? 'Converting...' : t ? `Converting: ${c}/${t}` : `Converting: ${c}`,
        FINISHING: 'Finishing...',
        COMPLETE: 'Complete!',
        DIAG_DEFAULT: 'Run Diagnostic',
        DIAGNOSING: 'Diagnosing...',
    };
    const UI_ICON_SET = {
        arrow: `<svg class="left-arrow-icon" aria-hidden="true" focusable="false" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M15 17.898C15 18.972 13.7351 19.546 12.9268 18.8388L6.61617 13.3169C5.81935 12.6197 5.81935 11.3801 6.61617 10.6829L12.9268 5.16108C13.7351 4.45388 15 5.02785 15 6.1018L15 17.898Z" fill="white"/></svg>`,        
        bookmark: `<svg class="bookmark-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 28 28"><path d="M9.25 3.5C7.45507 3.5 6 4.95507 6 6.75V24.75C6 25.0348 6.16133 25.2951 6.41643 25.4217C6.67153 25.5484 6.97638 25.5197 7.20329 25.3475L14 20.1914L20.7967 25.3475C21.0236 25.5197 21.3285 25.5484 21.5836 25.4217C21.8387 25.2951 22 25.0348 22 24.75V6.75C22 4.95507 20.5449 3.5 18.75 3.5H9.25Z" fill="white"/></svg>`,
        settings: `<svg class="settings-icon" aria-hidden="true" focusable="false" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19.9818 21.6364L21.7093 22.3948C22.0671 22.5518 22.4849 22.4657 22.7517 22.1799C23.9944 20.8492 24.9198 19.2536 25.4586 17.5131C25.5748 17.1376 25.441 16.7296 25.1251 16.4965L23.5988 15.3698C23.1628 15.0489 22.9 14.5403 22.9 13.9994C22.9 13.4586 23.1628 12.95 23.5978 12.6297L25.1228 11.5035C25.4386 11.2703 25.5723 10.8623 25.4561 10.487C24.9172 8.74611 23.9912 7.1504 22.7478 5.81991C22.4807 5.53405 22.0626 5.44818 21.7048 5.60568L19.9843 6.36294C19.769 6.45838 19.5385 6.507 19.3055 6.50663C18.4387 6.50572 17.7116 5.85221 17.617 4.98937L17.4079 3.11017C17.3643 2.71823 17.077 2.39734 16.6928 2.31149C15.8128 2.11485 14.9147 2.01047 14.0131 2.00006C13.0891 2.01071 12.19 2.11504 11.3089 2.31138C10.9245 2.39704 10.637 2.71803 10.5933 3.11017L10.3844 4.98794C10.3244 5.52527 10.0133 6.00264 9.54617 6.27415C9.07696 6.54881 8.50793 6.58168 8.01296 6.36404L6.29276 5.60691C5.93492 5.44941 5.51684 5.53528 5.24971 5.82114C4.00637 7.15163 3.08038 8.74734 2.54142 10.4882C2.42513 10.8638 2.55914 11.272 2.87529 11.5051L4.40162 12.6306C4.83721 12.9512 5.09414 13.4598 5.09414 14.0007C5.09414 14.5415 4.83721 15.0501 4.40219 15.3703L2.8749 16.4977C2.55922 16.7307 2.42533 17.1384 2.54122 17.5137C3.07924 19.2561 4.00474 20.8536 5.24806 22.1859C5.51493 22.4718 5.93281 22.558 6.29071 22.4009L8.01859 21.6424C8.51117 21.4269 9.07783 21.4586 9.54452 21.7281C10.0112 21.9976 10.3225 22.4731 10.3834 23.0093L10.5908 24.8855C10.6336 25.273 10.9148 25.5917 11.2933 25.682C13.0725 26.1061 14.9263 26.1061 16.7055 25.682C17.084 25.5917 17.3651 25.273 17.408 24.8855L17.6157 23.0066C17.675 22.4693 17.9729 21.9924 18.44 21.7219C18.9071 21.4515 19.4876 21.4197 19.9818 21.6364ZM14 18C11.7909 18 10 16.2091 10 14C10 11.7909 11.7909 10 14 10C16.2091 10 18 11.7909 18 14C18 16.2091 16.2091 18 14 18Z" fill="currentColor"/></svg>`,
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

    const RENDER_METHODS = {
        webp: createWebpMethod(),
        canvas: createCanvasMethod(),
        blob: createBlobMethod()
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
            message: 'Image access expired',
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
        LOSSLESS_WEBP_FAILED: {
            code: 'lossless-webp-failed',
            message: 'Failed to create lossless WebP',
            severity: 'important'
        },
        PNG_CONVERSION_FAILED: {
            code: 'png-conversion-failed',
            message: 'Failed to convert images to PNG',
            severity: 'normal'
        },
        JPEG_CONVERSION_FAILED: {
            code: 'jpeg-conversion-failed',
            message: 'Failed to convert images for PDF',
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
        PDF_CREATION_FAILED: {
            code: 'pdf-creation-failed',
            message: 'PDF file couldn\'t be created',
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
        WEBP_CONVERSION_FAILED: {
            code: 'webp-conversion-failed',
            message: 'Failed to convert images to WebP',
            severity: 'important'
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
            loggedPromoImages: new Set(),
            promoBlobImages: new Map()
        },
        diagnostics: {
            active: false,
            requests: new Map(),
            consoleHistory: []
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
            .offline-toast, .download-button, .download-popup {
                font-family: var(--font-app-default);
            }
            .download-button, .download-button *, .download-popup, .download-popup *, .offline-toast, .offline-toast * {
                user-select: none !important;
            }
            #offline-toast-container {
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
            .offline-toast {
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
            .offline-toast.closing {
                animation: toast-out 0.45s cubic-bezier(0.22, 1, 0.36, 1) forwards;
            }
            .offline-toast-text {
                opacity: 1;
                transition: opacity 0.1s linear 0.15s;
            }
            .offline-toast:hover .offline-toast-text {
                opacity: 0;
                transition: opacity 0.08s linear 0s;
            }
            .offline-toast-icon {
                position: absolute;
                inset: 0;
                display: flex;
                align-items: center;
                justify-content: center;
                opacity: 0;
                transition: opacity 0.1s linear 0s;
            }
            .offline-toast:hover .offline-toast-icon {
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
                min-width: 400px;
                max-width: 400px !important;
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
            .download-popup {
                box-sizing: border-box;
                max-width: calc(100vw - 24px);
                max-height: calc(100vh - 24px);
                overflow-y: auto;
            }
            .download-popup-pages {
                display: flow-root;
            }
            .download-popup-pages.resizing {
                overflow: hidden;
            }
            .download-popup-pages > .download-popup-page {
                min-width: 0;
            }
            .download-popup-page.page-inactive {
                display: none;
            }
            .download-popup-page-heading {
                display: flex;
                justify-content: space-between;
                align-items: center;
                gap: 16px;
                margin-bottom: 14px;
            }
            .download-popup-page-heading .download-popup-section-title {
                margin: 0;
                text-align: right;
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
            .download-popup-webp-options {
                box-sizing: border-box;
                margin: 0;
                min-width: 0;
                padding: 12px;
                border-radius: 10px;
                background: rgba(255,255,255,0.06);
            }
            .download-popup-page-heading .download-popup-quality-toggle {
                margin: 0;
            }
            .download-popup-webp-options select:disabled {
                opacity: 0.5;
                cursor: not-allowed;
            }
            .download-popup-quality-toggle {
                display: flex;
                align-items: center;
                gap: 3px;
                padding: 0;
                margin: 0 0 4px;
                border: 0;
                background: transparent;
                color: var(--color-app-text-secondary);
                font: inherit;
                font-size: var(--size-text-popup-section-highlight);
                text-align: left;
                cursor: pointer;
            }
            .download-popup-quality-toggle[hidden] {
                display: none;
            }
            .download-popup-quality-description {
                display: grid;
                grid-template-rows: 0fr;
                opacity: 0;
            }
            .download-popup-quality-description.description-visible {
                grid-template-rows: 1fr;
                opacity: 1;
            }
            .download-popup-quality-description > div {
                min-height: 0;
                overflow: hidden;
            }
            .download-popup-quality-toggle:hover {
                color: white;
            }
            .download-popup-webp-options select {
                box-sizing: border-box;
                max-width: 100%;
                width: 100%;
                margin: 6px 0 0;
                padding: 8px;
                border: 1px solid rgba(255,255,255,0.25);
                border-radius: 6px;
                background: #292929;
                color: white;
                font: inherit;
            }
            .download-popup-webp-options .download-popup-setting-highlight {
                margin-bottom: 0;
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
            .download-popup-section .download-popup-setting-row + .download-popup-setting-row {
                margin-top: 12px;
            }
            .download-popup-settings {
                border: 0;
                padding: 3px;
                background: transparent;
                color: var(--color-app-icon-default);
                font: inherit;
                cursor: pointer;
            }
            .download-popup-settings:hover, .download-popup-settings:focus-visible {
                color: white;
            }
            .download-popup-settings:hover .settings-icon {
                transform: rotate(360deg);
            }
            #webp-quality-disabled-note {
                padding-top: 8px;
            }
            #webp-quality-disabled-note.with-divider {
                margin-top: 10px;
                padding-top: 10px;
                border-top: 1px solid var(--color-app-divider);
            }
            #webp-quality-help {
                padding-top: 8px;
            }
            #webp-quality-options .download-popup-quality-description .download-popup-setting-highlight {
                padding-left: 5px;
                padding-right: 5px;
            }
            .download-popup-setting-row.setting-disabled {
                opacity: 0.45;
            }
            .switch input:disabled ~ span {
                cursor: not-allowed;
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
            #toggle-webp-quality {
                position: relative;
                overflow: visible;
                margin-top: 0;
                margin-bottom: 0;
            }
            #toggle-webp-quality::before, #toggle-webp-quality::after {
                content: none;
                display: none;
            }
            #toggle-webp-quality > .advanced-options-tooltip {
                all: initial;
                box-sizing: border-box;
                display: block;
                position: absolute;
                top: 50%;
                right: auto;
                bottom: auto;
                left: calc(100% + 8px);
                width: max-content;
                height: auto;
                padding: 6px 8px;
                border: 0;
                border-radius: 8px;
                background: var(--color-app-popup-tooltip);
                color: white;
                font-family: var(--font-app-default);
                font-size: 11px;
                line-height: 1.4;
                white-space: nowrap;
                text-align: left;
                z-index: 9999;
                opacity: 0;
                pointer-events: none;
                transform: translate(-4px, -50%);
                transition: opacity 0.2s ease, transform 0.2s ease;
            }
            #toggle-webp-quality:hover > .advanced-options-tooltip, #toggle-webp-quality:focus-visible > .advanced-options-tooltip {
                opacity: 1;
                transform: translate(0, -50%);
            }
            .download-popup-quality-toggle .left-arrow-icon {
                width: 14px;
                height: 14px;
                flex: 0 0 14px;
            }
            .settings-icon {
                display: block;
                width: 12px;
                height: 12px;
            }
            .settings-icon {
                transform-origin: center;
                transition: transform 0.45s ease;
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
            .offline-dim-overlay {
                position: fixed;
                inset: 0;
                z-index: 9990;
                background: var(--color-app-dim-overlay);
                opacity: 0;
                pointer-events: none;
                transition: opacity 0.25s ease;
            }
            .offline-dim-overlay.visible {
                opacity: 1;
            }
            body.lock-site-ui * {
                pointer-events: none !important;
                user-select: none !important;
            }
            body.lock-site-ui .download-button {
                pointer-events: auto !important;
            }
            @media (prefers-reduced-motion: reduce) {
                .settings-icon {
                    transition: none;
                }
                .download-popup-settings:hover .settings-icon {
                    transform: none;
                }
            }
        `;
        document.head.appendChild(style);
    }

    function init() {
        localStorage.removeItem('dim-screen');
        sessionStorage.removeItem(STORAGE_KEY_AUTO_REFRESH);
        initScriptObservers();
        disableSiteTelemetry();
        createStyles();
        createDimOverlay();
        createDownloadButton();
    }

    function initScriptObservers() {
        observeURLMutation();
        initDownloadButtonObserver();
        RENDER_METHODS.canvas.init();
        RENDER_METHODS.blob.init();
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

    function isMobileDevice() {
        const userAgentCheck = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const smallViewport = window.matchMedia('(max-width: 768px)').matches;
        const coarsePointer = window.matchMedia('(pointer: coarse)').matches;
        return userAgentCheck || (hasTouch && (smallViewport || coarsePointer));
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
            /^\/[a-z]{2}\/library\/comic\/[a-z]{2}-[A-Z]{2}\/[^\/]+\/[a-zA-Z0-9_-]+\/?$/;
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

    function getHorizontalViewerType() {
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

    function isHorizontalViewerLayout() {
        return getHorizontalViewerType() !== false;
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
            if (!cuts.length) {
                continue;
            }
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

    function getCutImage(cut, selector = 'img') {
        return cut?.matches(selector) ? cut : cut?.querySelector(selector);
    }

    function isPromoImage(image) {
        function getDetails() {
            if (!(image instanceof HTMLImageElement)) {
                return {
                    position: 'UNKNOWN',
                    html: null
                };
            }
            for (const selector of RENDER_PAGE_SELECTORS) {
                const containers = [...document.querySelectorAll(selector)];
                if (containers.length < 2) continue;
                const container = image.closest(selector);
                const position = containers.indexOf(container);
                if (position !== -1) {
                    return {
                        position: String(position + 1),
                        html: container.outerHTML
                    };
                }
            }
            const viewer = getViewerContainer();
            const images = viewer ? [...viewer.querySelectorAll('img')] : [];
            const position = images.indexOf(image);
            return {
                position: position === -1 ? 'UNKNOWN' : String(position + 1),
                html: image.outerHTML
            };
        }
        const src =
            typeof image === 'string' ?
            image :
            image?.src;
        if (!src) {
            return false;
        }
        const PROMO_IMAGE_URL_BLOCKLIST = [
            'banner', 'notice_contents', 'promotion', 'warning'
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
            const {
                position,
                html
            } = getDetails();
            const promoKey = `${position}:${src}`;
            if (
                isPromo &&
                image instanceof HTMLImageElement &&
                position !== 'UNKNOWN' &&
                !state.images.loggedPromoImages.has(promoKey)
            ) {
                state.images.loggedPromoImages.add(promoKey);
                if (src.startsWith('blob:')) {
                    state.images.promoBlobImages.set(
                        promoKey,
                        `PROMO BLOB (${position}): ${html}`
                    );
                }
                console.debug(
                    `${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION} - ` +
                    `PROMO: ${src} (${position})`
                );
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
            console.debug(`${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION} - ERROR SETTING SINGLE PAGE LAYOUT\n`, e);
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
                <span class="download-popup-meta-sep" aria-hidden="true">·</span>
                <button type="button" class="icon-tooltip download-popup-settings" id="toggle-webp-quality"
                    data-tooltip="Advanced Options" aria-label="Advanced Options" aria-controls="webp-quality-options" aria-expanded="false">
                    ${UI_ICON_SET.settings}
                    <span class="advanced-options-tooltip" aria-hidden="true">Advanced Options</span>
                </button>
            </div>
            <div class="download-popup-divider"></div>
            <div class="download-popup-pages">
            <div class="download-popup-sections download-popup-page" id="download-popup-home">
                <div class="download-popup-section">
                    <div class="download-popup-section-title">Downloads</div>
                    <div class="download-popup-setting-row">
                        <div class="download-popup-setting-text">
                            <div class="download-popup-setting-label">Save as PDF</div>
                            <div class="download-popup-setting-highlight">Downloads chapter images as a .pdf file</div>
                        </div>
                        <label class="switch">
                            <input type="checkbox" id="toggle-pdf">
                            <span class="switch-track"></span>
                            <span class="switch-thumb"></span>
                        </label>
                    </div>
                    <div class="download-popup-setting-row">
                        <div class="download-popup-setting-text">
                            <div class="download-popup-setting-label">Small image size</div>
                            <div class="download-popup-setting-highlight">Downloads chapter images as .webp</div>
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
                    <div class="download-popup-setting-highlight">Simulates a chapter download & exports a debug log as a .log file</div>
                    <button class="diagnostic-button" id="button-run-diagnostic">${UI_BUTTON_LABELS.DIAG_DEFAULT}</button>
                </div>
            </div>
                <div class="download-popup-webp-options download-popup-page page-inactive" id="webp-quality-options" aria-hidden="true" inert>
                    <div class="download-popup-page-heading">
                        <button type="button" class="download-popup-quality-toggle" id="back-to-download-options">${UI_ICON_SET.arrow}Back</button>
                        <div class="download-popup-section-title">Advanced options</div>
                    </div>
                    <label class="download-popup-setting-label" for="select-webp-quality">WebP Quality</label>
                    <select id="select-webp-quality" aria-describedby="webp-quality-help webp-quality-disabled-note">
                        <option value="1.0">Max Quality (recommended)</option>
                        <option value="browser-default">Browser Default</option>
                    </select>
                    <div class="download-popup-quality-description" id="webp-quality-description" aria-hidden="true">
                        <div><div class="download-popup-setting-highlight" id="webp-quality-help">Uses your browser\'s encoder quality which varies by browser. May apply a blurring effect that smooths out edges and reduces noise.</div></div>
                    </div>
                    <div class="download-popup-quality-description" id="webp-quality-disabled-description" aria-hidden="true">
                        <div><div class="download-popup-setting-highlight" id="webp-quality-disabled-note">Small image size option is disabled</div></div>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(popup);
        const savedSmallFileSize = localStorage.getItem(STORAGE_KEY_SMALL_FILE_SIZE) === 'true';
        const smallFileSizeToggle = popup.querySelector('#toggle-small-file-size');
        smallFileSizeToggle.checked = savedSmallFileSize;
        const homePage = popup.querySelector('#download-popup-home');
        const backButton = popup.querySelector('#back-to-download-options');
        const qualityOptions = popup.querySelector('#webp-quality-options');
        const qualityToggle = popup.querySelector('#toggle-webp-quality');
        const qualitySelect = popup.querySelector('#select-webp-quality');
        const qualityDescription = popup.querySelector('#webp-quality-description');
        const qualityDisabledDescription = popup.querySelector('#webp-quality-disabled-description');
        const qualityDisabledNote = popup.querySelector('#webp-quality-disabled-note');
        const popupPages = popup.querySelector('.download-popup-pages');
        let panelResizeAnimation = null;
        const resizePanel = update => {
            const previousHeight = popupPages.getBoundingClientRect().height;
            if (panelResizeAnimation) {
                panelResizeAnimation.cancel();
                panelResizeAnimation = null;
            }
            popupPages.classList.remove('resizing');
            update();
            const nextHeight = popupPages.getBoundingClientRect().height;
            if (!popup.classList.contains('visible') ||
                window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
                Math.abs(previousHeight - nextHeight) < 0.5) return;
            popupPages.classList.add('resizing');
            const animation = popupPages.animate([{
                    height: previousHeight + 'px'
                },
                {
                    height: nextHeight + 'px'
                }
            ], {
                duration: 200,
                easing: 'ease'
            });
            panelResizeAnimation = animation;
            animation.onfinish = () => {
                if (panelResizeAnimation !== animation) return;
                panelResizeAnimation = null;
                popupPages.classList.remove('resizing');
            };
        };
        const updateQualityHelp = () => {
            const unavailable = !smallFileSizeToggle.checked || smallFileSizeToggle.disabled;
            const visible = qualitySelect.value === 'browser-default' && !unavailable;
            qualityDescription.classList.toggle('description-visible', visible);
            qualityDescription.setAttribute('aria-hidden', String(!visible));
            qualityDisabledDescription.classList.toggle('description-visible', unavailable);
            qualityDisabledDescription.setAttribute('aria-hidden', String(!unavailable));
            qualityDisabledNote.classList.toggle('with-divider', visible && unavailable);
        };
        const syncQualityHelp = () => resizePanel(updateQualityHelp);
        let qualityExpanded = false;
        qualitySelect.value = usesBrowserWebpQuality() ? 'browser-default' : '1.0';
        syncQualityHelp();
        qualitySelect.addEventListener('change', () => {
            localStorage.setItem(STORAGE_KEY_WEBP_QUALITY, qualitySelect.value);
            syncQualityHelp();
        });
        const syncWebpQualityOptions = () => resizePanel(() => {
            const available = smallFileSizeToggle.checked && !smallFileSizeToggle.disabled;
            qualityToggle.setAttribute('aria-expanded', String(qualityExpanded));
            homePage.classList.toggle('page-inactive', qualityExpanded);
            homePage.inert = qualityExpanded;
            homePage.setAttribute('aria-hidden', String(qualityExpanded));
            qualityOptions.classList.toggle('page-inactive', !qualityExpanded);
            qualityOptions.inert = !qualityExpanded;
            qualityOptions.setAttribute('aria-hidden', String(!qualityExpanded));
            qualitySelect.disabled = !available;
            updateQualityHelp();
        });
        qualityToggle.addEventListener('click', () => {
            qualityExpanded = true;
            syncWebpQualityOptions();
            backButton.focus({
                preventScroll: true
            });
        });
        backButton.addEventListener('click', () => {
            qualityExpanded = false;
            syncWebpQualityOptions();
            qualityToggle.focus({
                preventScroll: true
            });
        });
        smallFileSizeToggle.addEventListener('change', () => {
            localStorage.setItem(STORAGE_KEY_SMALL_FILE_SIZE, String(smallFileSizeToggle.checked));
            syncWebpQualityOptions();
        });
        const pdfToggle = popup.querySelector('#toggle-pdf');
        pdfToggle.checked = localStorage.getItem(STORAGE_KEY_SAVE_AS_PDF) === 'true';
        const syncPDFOptions = () => {
            smallFileSizeToggle.disabled = pdfToggle.checked;
            smallFileSizeToggle.checked = !pdfToggle.checked &&
                localStorage.getItem(STORAGE_KEY_SMALL_FILE_SIZE) === 'true';
            smallFileSizeToggle.closest('.download-popup-setting-row')
                .classList.toggle('setting-disabled', pdfToggle.checked);
            syncWebpQualityOptions();
        };
        pdfToggle.addEventListener('change', () => {
            localStorage.setItem(STORAGE_KEY_SAVE_AS_PDF, String(pdfToggle.checked));
            syncPDFOptions();
        });
        syncPDFOptions();
        const diagnosticButton = popup.querySelector('#button-run-diagnostic');
        diagnosticButton.addEventListener('click', () => {
            hidePopup();
            executeDiagnosticPipeline(btn, diagnosticButton);
        });
        let showTimer = null;
        let hideTimer = null;
        let qualityResetTimer = null;

        function showPopup() {
            if (btn.disabled) return;
            clearTimeout(qualityResetTimer);
            const rect = btn.getBoundingClientRect();
            const bounds = popup.getBoundingClientRect();
            popup.style.top = Math.max(12, Math.min(rect.bottom + 8, window.innerHeight - bounds.height - 12)) + 'px';
            popup.style.left = Math.max(bounds.width / 2 + 12, Math.min(rect.left + rect.width / 2, window.innerWidth - bounds.width / 2 - 12)) + 'px';
            popup.style.maxHeight = Math.max(0, window.innerHeight - parseFloat(popup.style.top) - 12) + 'px';
            popup.classList.add('visible');
        }

        function resetHiddenQualityOptions() {
            if (popup.classList.contains('visible') || Number(getComputedStyle(popup).opacity) > 0) return;
            clearTimeout(qualityResetTimer);
            qualityExpanded = false;
            syncWebpQualityOptions();
        }
        popup.addEventListener('transitionend', event => {
            if (event.target === popup && event.propertyName === 'opacity') resetHiddenQualityOptions();
        });

        function hidePopup() {
            popup.classList.remove('visible');
            clearTimeout(qualityResetTimer);
            qualityResetTimer = setTimeout(resetHiddenQualityOptions, 220);
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
        if (document.querySelector('.offline-dim-overlay')) return;
        const overlay = document.createElement('div');
        overlay.className = 'offline-dim-overlay';
        document.body.appendChild(overlay);
    }

    function showDimOverlay() {
        const overlay = document.querySelector('.offline-dim-overlay');
        if (overlay) overlay.classList.add('visible');
    }

    function hideDimOverlay() {
        const overlay = document.querySelector('.offline-dim-overlay');
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

    function createToastContainer() {
        if (document.getElementById('offline-toast-container')) return;
        const container = document.createElement('div');
        container.id = 'offline-toast-container';
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
        toast.className = 'offline-toast';
        toast.setAttribute('aria-label', 'Dismiss');
        toast.innerHTML =
            `<span class="offline-toast-text"></span>` +
            `<span class="offline-toast-icon">${UI_ICON_SET.trash}</span>`;
        toast.querySelector('.offline-toast-text').textContent = message;
        toast.onclick = () => closeToast(toast);
        document
            .getElementById('offline-toast-container')
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
        console.debug(`${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION} - DOWNLOAD ERROR OCCURRED, SEE CONSOLE BELOW\n`, error);
        showErrorMessage(
            DOWNLOAD_ERROR_MAP.UNKNOWN_ERROR.message,
            DOWNLOAD_ERROR_MAP.UNKNOWN_ERROR.severity
        );
    }

    async function executeDownloadPipeline(btn) {
        if (state.ui.isDownloading) return;
        const renderType = resolveRenderType();
        if (!renderType) return;
        const usePDF = localStorage.getItem(STORAGE_KEY_SAVE_AS_PDF) === 'true';
        const oneImagePerPage = usePDF && isHorizontalViewerLayout();
        const useSmallFileSize = !usePDF && localStorage.getItem(STORAGE_KEY_SMALL_FILE_SIZE) === 'true';
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
            const collected = await collectChapterImages(session, renderType, onCollect);
            const images = validateCollectedImages(session, collected.images);
            state.ui.phase = 'downloading';
            if (collected.renderType === 'canvas' && !usePDF) {
                const {
                    zip,
                    donePromise
                } = createZipInstance();
                const success = await RENDER_METHODS.canvas.streamZip(session, images, zip, onConvert, useSmallFileSize);
                if (!success) throwDownloadError('DOWNLOAD_ABORTED');
                await finalizeZip(zip, donePromise);
            } else {
                const files = collected.renderType === 'canvas' ?
                    await RENDER_METHODS.canvas.buildPDFFiles(session, images, onConvert) :
                    collected.renderType === 'blob' ?
                    await RENDER_METHODS.blob.buildFiles(session, images, onConvert, useSmallFileSize, usePDF) :
                    await RENDER_METHODS.webp.buildFiles(session, images, onConvert, useSmallFileSize, usePDF);
                if (usePDF) {
                    await downloadChapterPDF(session, files, getSeriesTitle(), getSeriesChapter(), setLabel, oneImagePerPage);
                } else {
                    if (session.cancelled) throwDownloadError('DOWNLOAD_ABORTED');
                    if (!files || !Object.keys(files).length) throwDownloadError('NO_IMAGES_COLLECTED');
                    const {
                        zip,
                        donePromise
                    } = createZipInstance();
                    const entries = Object.entries(files);
                    let completedCount = 0;
                    for (const [name, data] of entries) {
                        if (session.cancelled) throwDownloadError('DOWNLOAD_ABORTED');
                        const file = new fflate.ZipDeflate(name, {
                            level: 6
                        });
                        zip.add(file);
                        file.push(data, true);
                        onConvert(++completedCount, entries.length);
                    }
                    await finalizeZip(zip, donePromise);
                }
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

    async function collectChapterImages(session, renderType, onProgress) {
        function getCollectionMethod(renderType, horizontalType = getHorizontalViewerType()) {
            const method = RENDER_METHODS[renderType];
            return method ? method.horizontal[horizontalType] || method.normal : null;
        }
        const visited = new Set();
        while (!visited.has(renderType)) {
            if (session.cancelled) throwDownloadError('DOWNLOAD_ABORTED');
            visited.add(renderType);
            const collect = getCollectionMethod(renderType);
            if (!collect) throwDownloadError('NO_IMAGES_COLLECTED');
            const result = await collect(session, onProgress);
            if (session.cancelled) throwDownloadError('DOWNLOAD_ABORTED');
            if (renderType === 'webp' && result.switchTo) {
                renderType = result.switchTo;
                setRenderType(renderType);
                continue;
            }
            if (renderType === 'webp') {
                await retryMissingPages(session, state.ui.images, onProgress);
                if (session.cancelled) throwDownloadError('DOWNLOAD_ABORTED');
                return {
                    renderType,
                    images: RENDER_METHODS.webp.orderedPages()
                };
            }
            return {
                renderType,
                images: result
            };
        }
        throwDownloadError('NO_IMAGES_COLLECTED');
    }

    function validateCollectedPageCount(collectedCount) {
        function getPromoCount() {
            return getIndexedComicCuts()
                .filter(cut => {
                    const img = getCutImage(cut);
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
            getHorizontalViewerType() === 'jp';
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
                    const img = getCutImage(cut);
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
        const started = performance.now();
        const method = collectedMap === state.canvas.pages ? 'canvas-scroll' :
            collectedMap === state.ui.images ? 'webp-scroll' : 'page-scroll';
        let attemptsUsed = 0;
        let stopReason = 'attempt-limit';
        logCollection('RETRY START', {
            method,
            maxAttempts,
            scrollDelay,
            idleWait,
            nudgeScroll
        });
        const delayMs = scrollDelay;
        for (
            let attempt = 0; attempt < maxAttempts && !session.cancelled; attempt++
        ) {
            const missing = findMissingPages(collectedMap);
            if (!missing.length) {
                stopReason = 'complete';
                break;
            }
            const missingKey = missing.join(', ');
            if (missingKey === previousMissingKey) {
                stopReason = 'no-progress';
                break;
            }
            previousMissingKey = missingKey;
            attemptsUsed++;
            logCollection('RETRY ATTEMPT', {
                method,
                attempt: attemptsUsed,
                maxAttempts,
                missing
            });
            if (beforeAttempt) {
                await beforeAttempt(missing);
            }
            for (const index of missing) {
                if (session.cancelled) {
                    break;
                }
                const pageStarted = performance.now();
                scrollToComicPage(index, {
                    instant: true,
                    allowLastPage: false
                });
                await new Promise(r =>
                    setTimeout(r, delayMs)
                );
                logCollection('PAGE', {
                    method,
                    phase: 'retry',
                    index,
                    outcome: session.cancelled ? 'cancelled' : collectedMap.has(index) ? 'collected' : 'still-missing',
                    startedAt: pageStarted,
                    attempt: attemptsUsed,
                    maxAttempts,
                    waitBudgetMs: delayMs
                });
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
                const idleStarted = performance.now();
                const idleReached = await RENDER_METHODS.canvas.waitForIdle(
                    isFirstRetry ?
                    250 :
                    (fewMissing ? 120 : 150),
                    isFirstRetry ?
                    900 :
                    (fewMissing ? 400 : 500)
                );
                logCollection('IDLE WAIT', {
                    method,
                    attempt: attemptsUsed,
                    outcome: idleReached ? 'idle' : 'timeout',
                    startedAt: idleStarted
                });
            }
        }
        const finalMissing = findMissingPages(collectedMap);
        logCollection('RETRY END', {
            method,
            attemptsUsed,
            maxAttempts,
            stopReason: session.cancelled ? 'cancelled' : !finalMissing.length ? 'complete' : stopReason,
            missing: finalMissing,
            startedAt: started
        });
        return finalMissing;
    }

    function logCollection(event, {
        startedAt,
        ...details
    } = {}, level = 'debug') {
        if (startedAt !== undefined) {
            details.elapsedMs = startedAt === null ? null : Math.round(performance.now() - startedAt);
        }
        const message = `${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION} - COLLECTION: ${event}`;
        if (level === 'warn') {
            console.warn(message, details);
        } else {
            console.debug(message, details);
        }
    }

    function createWebpMethod() {
        async function collectKrWebpImages(session, onProgress) {
            return {
                images: await collectHorizontalWebpPages(session, onProgress),
                switchTo: null
            };
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
                        const img = getCutImage(cut);
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
                const pageStarted = performance.now();
                const injected = await waitForImageInjection(
                    cut,
                    1500
                );
                logCollection('PAGE', {
                    method: 'webp-injection',
                    phase: 'initial',
                    index,
                    outcome: session.cancelled ? 'cancelled' : injected ? 'source-available' : 'timeout',
                    startedAt: pageStarted,
                    waitBudgetMs: 1500
                });
                const liveWrapper =
                    getViewerContainer();
                if (liveWrapper) {
                    if (
                        liveWrapper.querySelector(
                            'canvas'
                        )
                    ) {
                        setRenderType('canvas');
                        console.log(`${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION} - RENDER METHOD OVERRIDE: WEBP -> %cCANVAS`, 'font-weight:bold;');
                        return {
                            images: null,
                            switchTo: 'canvas'
                        };
                    }
                    if (
                        liveWrapper.querySelector("img[src^='blob:']")
                    ) {
                        setRenderType('blob');
                        console.log(`${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION} - RENDER METHOD OVERRIDE: WEBP -> %cBLOB`, 'font-weight:bold;');
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
                console.debug(`${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION} - UI SLIDER MISSING IN HORIZONTAL LAYOUT`);
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
            let pageStarted = performance.now();
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
                logCollection('PAGE', {
                    method: 'webp-horizontal-navigation',
                    phase: 'initial',
                    index,
                    outcome: state.ui.images.has(index) ? 'source-collected' : 'still-missing',
                    startedAt: pageStarted
                });
                if (index >= total) break;
                const previousIndex = index;
                const previousSrc = img?.src;
                pageStarted = performance.now();
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

        async function buildWebpImageFiles(session, images, onProgress, useSmallFileSize, usePDF = false) {
            const browserWebp = !usePDF && useSmallFileSize && usesBrowserWebpQuality();
            const mimeType = usePDF ? 'image/jpeg' : browserWebp ? 'image/webp' : 'image/png';
            const extension = usePDF ? 'jpg' : browserWebp ? 'webp' : 'png';
            const conversionError = usePDF ? 'JPEG_CONVERSION_FAILED' : browserWebp ? 'WEBP_CONVERSION_FAILED' : 'PNG_CONVERSION_FAILED';
            const quality = usePDF ? 0.92 : undefined;
            async function convertWebpPages(session, urls, onProgress) {
                const files = {};
                const total = urls.length;
                let completed = 0;
                onProgress(0, total);
                const workerCount = getOptimalWorkerCount();
                const CAN_USE_OFFSCREEN = !browserWebp && typeof OffscreenCanvas !== 'undefined' &&
                    OffscreenCanvas.prototype.convertToBlob &&
                    typeof createImageBitmap === 'function';
                const idleYield = () => new Promise(r => requestAnimationFrame(r));
                async function convertWebpImage(webpBytes) {
                    if (CAN_USE_OFFSCREEN) {
                        const blob = new Blob([webpBytes], {
                            type: 'image/webp'
                        });
                        const bitmap = await createImageBitmap(blob);
                        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
                        const ctx = canvas.getContext('2d', {
                            alpha: !usePDF
                        });
                        if (usePDF) {
                            ctx.fillStyle = '#FFF';
                            ctx.fillRect(0, 0, canvas.width, canvas.height);
                        }
                        ctx.drawImage(bitmap, 0, 0);
                        bitmap.close();
                        const encodedBlob = await canvas.convertToBlob({
                            type: mimeType,
                            quality
                        });
                        return new Uint8Array(await encodedBlob.arrayBuffer());
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
                            if (usePDF) {
                                ctx.fillStyle = '#FFF';
                                ctx.fillRect(0, 0, canvas.width, canvas.height);
                            }
                            ctx.drawImage(img, 0, 0);
                            if (browserWebp) {
                                encodeCanvasImage(canvas, mimeType).then(resolve, reject);
                                return;
                            }
                            canvas.toBlob(encodedBlob => {
                                if (!encodedBlob) {
                                    return reject(
                                        new Error(
                                            DOWNLOAD_ERROR_MAP[conversionError].code
                                        )
                                    );
                                }
                                encodedBlob.arrayBuffer().then(
                                    buffer => resolve(new Uint8Array(buffer)), reject
                                );
                            }, mimeType, quality);
                        };
                        img.onerror = () => {
                            URL.revokeObjectURL(url);
                            reject(
                                new Error(
                                    DOWNLOAD_ERROR_MAP[conversionError].code
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
                    const encoded = await convertWebpImage(webp).catch(() => {
                        throwDownloadError(conversionError);
                    });
                    if (session.cancelled) return null;
                    completed++;
                    onProgress(completed, total);
                    if (completed % 2 === 0) await idleYield();
                    return {
                        name: generateImageFileName(index + 1, total, extension),
                        data: encoded
                    };
                });
                for (const r of results) {
                    if (r) files[r.name] = r.data;
                }
                return files;
            }
            if (usePDF || !useSmallFileSize || browserWebp) return convertWebpPages(session, images, onProgress);
            const files = {};
            const total = images.length;
            let completedWebp = 0;
            onProgress(0, total);
            const workerCount = getOptimalWorkerCount();
            const jobs = images.map((url, index) => ({
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
                onProgress(completedWebp, total);
                return {
                    name: generateImageFileName(index + 1, total, 'webp'),
                    data
                };
            });
            for (const r of results) {
                if (r) files[r.name] = r.data;
            }
            return files;
        }
        return {
            normal: collectWebpPages,
            horizontal: {
                kr: collectKrWebpImages
            },
            orderedPages: getOrderedWebpPageList,
            buildFiles: buildWebpImageFiles
        };
    }

    function createCanvasMethod() {
        function initCanvasDrawHook() {
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
                const pageStarted = performance.now();
                const index = Number(cut.dataset.cutIndex);
                const precollected = state.canvas.pages.has(index);
                scrollToComicPage(
                    index,
                    'smooth'
                );
                await new Promise(r => setTimeout(r, 300));
                logCollection('PAGE', {
                    method: 'canvas-scroll',
                    phase: 'initial',
                    index,
                    outcome: session.cancelled ? 'cancelled' : precollected ? 'already-collected' : state.canvas.pages.has(index) ? 'collected' : 'still-missing',
                    startedAt: pageStarted,
                    waitBudgetMs: 300
                });
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
            let cyclesUsed = 0;
            let cycleStopReason = 'attempt-limit';
            for (let attempt = 0; attempt < 4 && !session.cancelled; attempt++) {
                const missing = findMissingPages(state.canvas.pages);
                if (!missing.length) {
                    cycleStopReason = 'complete';
                    break;
                }
                if (missing.length >= previousMissingCount) {
                    cycleStopReason = 'no-progress';
                    break;
                }
                cyclesUsed++;
                logCollection('RETRY CYCLE', {
                    method: 'canvas-scroll',
                    cycle: cyclesUsed,
                    maxCycles: 4
                });
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
            const remaining = findMissingPages(state.canvas.pages);
            logCollection('RETRY CYCLES END', {
                method: 'canvas-scroll',
                cyclesUsed,
                maxCycles: 4,
                stopReason: session.cancelled ? 'cancelled' : !remaining.length ? 'complete' : cycleStopReason,
                missing: remaining
            });
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
            if (mimeType === 'image/jpeg') {
                ctx.fillStyle = '#FFF';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
            page.ops.forEach(op => {
                ctx.drawImage(
                    img,
                    op.sx, op.sy, op.sw, op.sh,
                    op.dx, op.dy, op.dw, op.dh
                );
            });
            return encodeCanvasImage(canvas, mimeType, quality);
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

        async function buildCanvasPDFFiles(session, pages, onProgress) {
            const files = {};
            onProgress(0, pages.length);
            for (let i = 0; i < pages.length; i++) {
                if (session.cancelled) throwDownloadError('DOWNLOAD_ABORTED');
                files[generateImageFileName(i + 1, pages.length)] =
                    await convertCanvasPage(pages[i], 'image/jpeg', 0.92);
                onProgress(i + 1, pages.length);
            }
            return files;
        }
        return {
            normal: collectCanvasPages,
            horizontal: {},
            init: initCanvasDrawHook,
            waitForIdle: waitForCanvasIdle,
            streamZip: streamCanvasImagesToZip,
            buildPDFFiles: buildCanvasPDFFiles,
        };
    }

    function createBlobMethod() {
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
                    const img = getCutImage(el, 'img[src^="blob:"]');
                    if (!img || !img.complete || !img.naturalWidth) return;
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

        async function collectNormalBlobImages(session, onProgress) {
            const layout = getViewerLayoutConfig();
            const expectedCount = layout.pageSource === 'cuts' ?
                getAllPageIndexes().length : getTotalPageCount();
            if (state.blob.pages.size !== expectedCount) {
                state.blob.pages.clear();
                for (const [index, data] of state.blob.buffer) {
                    const blob = new Blob([data], {
                        type: 'image/png'
                    });
                    const img = new Image();
                    img.src = URL.createObjectURL(blob);
                    state.blob.pages.set(index, img);
                }
                state.blob.buffer.clear();
                state.blob.enabled = true;
                try {
                    await collectBlobPages(session, onProgress);
                } finally {
                    state.blob.enabled = false;
                }
            }
            return getOrderedBlobPageList(state.blob.pages);
        }

        async function collectJpBlobImages(session, onProgress) {
            const pages = new Map(state.blob.pages);
            const collected = await collectHorizontalBlobPages(session, onProgress, pages);
            for (const [index, image] of collected) pages.set(index, image);
            state.blob.pages = pages;
            return getOrderedBlobPageList(pages);
        }

        async function collectBlobPages(
            session,
            onProgress
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
                let pendingObservation = null;
                const initialStarted = performance.now();
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
                        const img = getCutImage(el, 'img[src^="blob:"]');
                        if (!img) return;
                        if (!img.complete || !img.naturalWidth) return;
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
                    pendingObservation = {
                        index: firstMissing,
                        started: performance.now()
                    };
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
                    for (const {
                            index,
                            img
                        }
                        of blobs) {
                        if (!collected.has(index)) {
                            collected.set(index, img);
                            if (pendingObservation?.index !== index) {
                                logCollection('PAGE', {
                                    method: 'blob-scan-scroll',
                                    phase: 'initial',
                                    index,
                                    outcome: 'observed-available',
                                    startedAt: null,
                                    timingNote: 'No individual scroll start (may be pre-loaded or loaded alongside another page)'
                                });
                            }
                        }
                    }
                    if (pendingObservation) {
                        logCollection('PAGE', {
                            method: 'blob-scan-scroll',
                            phase: 'initial',
                            index: pendingObservation.index,
                            outcome: collected.has(pendingObservation.index) ? 'collected' : 'still-missing',
                            startedAt: pendingObservation.started,
                            waitBudgetMs: WAIT_AFTER_SCROLL_MS
                        });
                        pendingObservation = null;
                    }
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
                            logCollection('INITIAL STALLED', {
                                method: 'blob-scan-scroll',
                                collected: collected.size,
                                total: totalContainers,
                                stopReason: 'no-progress'
                            }, 'warn');
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
                if (pendingObservation) {
                    logCollection('PAGE', {
                        method: 'blob-scan-scroll',
                        phase: 'initial',
                        index: pendingObservation.index,
                        outcome: 'cancelled',
                        startedAt: pendingObservation.started
                    });
                }
                logCollection('INITIAL END', {
                    method: 'blob-scan-scroll',
                    collected: collected.size,
                    stopReason: session.cancelled ? 'cancelled' : collected.size >= getPageContainers().length && collected.size > 0 ? 'complete' : 'no-progress',
                    stallTimeoutMs: STALL_TIMEOUT_MS,
                    startedAt: initialStarted
                });
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
            const retryStarted = performance.now();
            let attemptsUsed = 0;
            let stopReason = 'attempt-limit';
            const BLOB_RETRY_ATTEMPTS = 4;
            const BLOB_PAGE_HYDRATION_TIMEOUT_MS = 5000;
            let previousMissingKey = null;

            function waitForHydratedBlob(index) {
                return new Promise(resolve => {
                    const container = getIndexedComicCuts().find(cut =>
                        Number(cut.dataset.cutIndex) === index
                    );
                    if (!container) {
                        resolve({
                            img: null,
                            outcome: 'container-not-found',
                            details: 'CONTAINER NOT FOUND'
                        });
                        return;
                    }
                    let observedImage = null;
                    let settled = false;
                    const getImage = () => getCutImage(container);
                    const getDetails = () => {
                        const img = getImage();
                        return `IMG: ${img ? 'PRESENT' : 'NOT FOUND'} | ` +
                            `SRC: ${img?.src || 'NONE'} | ` +
                            `COMPLETE: ${img?.complete ? 'TRUE' : 'FALSE'} | ` +
                            `NATURAL_WIDTH: ${img?.naturalWidth || 0}`;
                    };
                    const isHydratedBlob = img =>
                        img &&
                        img.src.startsWith('blob:') &&
                        img.complete &&
                        img.naturalWidth > 0;
                    const cleanup = () => {
                        observer.disconnect();
                        clearTimeout(timeout);
                    };
                    const finish = img => {
                        if (settled) return;
                        settled = true;
                        cleanup();
                        resolve({
                            img,
                            outcome: img ? 'hydrated' : 'timeout',
                            details: getDetails()
                        });
                    };
                    const check = () => {
                        const img = getImage();
                        if (isHydratedBlob(img)) {
                            finish(img);
                            return;
                        }
                        if (img && img !== observedImage) {
                            observedImage = img;
                            img.addEventListener('load', check, {
                                once: true
                            });
                        }
                    };
                    const observer = new MutationObserver(check);
                    observer.observe(container, {
                        childList: true,
                        subtree: true,
                        attributes: true,
                        attributeFilter: ['src']
                    });
                    const timeout = setTimeout(
                        () => finish(null),
                        BLOB_PAGE_HYDRATION_TIMEOUT_MS
                    );
                    check();
                });
            }
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
                logCollection('RETRY MISSING', {
                    method: 'blob-hydration-scroll',
                    missing
                });
                if (
                    missingKey ===
                    previousMissingKey
                ) {
                    stopReason = 'no-progress';
                    logCollection('RETRY STALLED', {
                        method: 'blob-hydration-scroll',
                        stopReason: 'no-progress',
                        missing
                    }, 'warn');
                    break;
                }
                previousMissingKey =
                    missingKey;
                attemptsUsed++;
                logCollection('RETRY ATTEMPT', {
                    method: 'blob-hydration-scroll',
                    attempt: attemptsUsed,
                    maxAttempts: BLOB_RETRY_ATTEMPTS,
                    waitBudgetMs: BLOB_PAGE_HYDRATION_TIMEOUT_MS,
                    missing
                });
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
                    const pageStarted = performance.now();
                    const result = await waitForHydratedBlob(index);
                    logCollection('PAGE', {
                        method: 'blob-hydration-scroll',
                        phase: 'retry',
                        index,
                        outcome: session.cancelled ? 'cancelled' : result.outcome,
                        startedAt: pageStarted,
                        attempt: attemptsUsed,
                        maxAttempts: BLOB_RETRY_ATTEMPTS,
                        waitBudgetMs: BLOB_PAGE_HYDRATION_TIMEOUT_MS
                    });
                    if (!result.img) {
                        logCollection('PAGE HYDRATION FAILED', {
                            method: 'blob-hydration-scroll',
                            phase: 'retry',
                            index,
                            outcome: result.outcome,
                            details: result.details
                        }, 'warn');
                        continue;
                    }
                    state.blob.pages.set(index, result.img);
                    logCollection('RETRY RECOVERED', {
                        method: 'blob-hydration-scroll',
                        index
                    });
                    onProgress?.(state.blob.pages.size);
                    await new Promise(r => setTimeout(r, 120));
                }
            }
            const finalMissing =
                findMissingPages(
                    state.blob.pages
                );
            logCollection('RETRY END', {
                method: 'blob-hydration-scroll',
                attemptsUsed,
                maxAttempts: BLOB_RETRY_ATTEMPTS,
                stopReason: session.cancelled ? 'cancelled' : !finalMissing.length ? 'complete' : stopReason,
                missing: finalMissing,
                startedAt: retryStarted
            });
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
                    const pageStarted = performance.now();
                    img = await waitForImage(spreadEl, 3000);
                    logCollection('PAGE', {
                        method: 'blob-horizontal-hydration',
                        phase: attempt === 0 ? 'initial' : 'retry',
                        index: pageNum,
                        outcome: session.cancelled ? 'cancelled' : img ? 'hydrated' : 'timeout',
                        startedAt: pageStarted,
                        attempt: attempt + 1,
                        maxAttempts: MAX_RETRIES,
                        waitBudgetMs: 3000
                    });
                    if (img) break;
                    await new Promise(r => setTimeout(r, 250));
                    spreadEl = getActiveSpread();
                }
                logCollection('PAGE ATTEMPTS END', {
                    method: 'blob-horizontal-hydration',
                    index: pageNum,
                    stopReason: session.cancelled ? 'cancelled' : img ? 'complete' : 'attempt-limit',
                    maxAttempts: MAX_RETRIES
                });
                if (!img) {
                    logCollection('PAGE FAILED', {
                        method: 'blob-horizontal-hydration',
                        index: pageNum
                    }, 'warn');
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

        async function buildBlobImageFiles(session, images, onProgress, useSmallFileSize = false, usePDF = false) {
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
                if (mimeType === 'image/jpeg') {
                    ctx.fillStyle = '#FFF';
                    ctx.fillRect(0, 0, canvas.width, canvas.height);
                }
                ctx.drawImage(img, 0, 0);
                return encodeCanvasImage(canvas, mimeType, quality);
            }
            const files = {};
            const total = images.length;
            onProgress(0, total);
            const workerCount = getOptimalWorkerCount();
            let completed = 0;
            const mimeType = usePDF ? 'image/jpeg' : useSmallFileSize ? 'image/webp' : 'image/png';
            const ext = usePDF ? 'jpg' : useSmallFileSize ? 'webp' : 'png';
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
                    const imgData = await convertBlobImage(img, mimeType, usePDF ? 0.92 : undefined);
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
        return {
            normal: collectNormalBlobImages,
            horizontal: {
                jp: collectJpBlobImages
            },
            init: initBlobBackgroundCollector,
            buildFiles: buildBlobImageFiles
        };
    }

    function getImageData(url) {
        return new Promise((resolve, reject) => {
            recordDiagnosticRequest('GET', url, '', false);

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
                    recordDiagnosticRequest('GET', url, `HTTP/${status || 0}`);
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
                    recordDiagnosticRequest('GET', url, 'HTTP/0 NETWORK ERROR');
                    fail('NETWORK_ERROR', {
                        url,
                        error
                    });
                },
                ontimeout: () => {
                    recordDiagnosticRequest('GET', url, 'HTTP/0 TIMEOUT');
                    fail('REQUEST_TIMEOUT', url);
                }
            });
        });
    }

    function isLosslessWebp(bytes) {
        const tag = offset => String.fromCharCode(...bytes.subarray(offset, offset + 4));
        if (bytes.length < 12 || tag(0) !== 'RIFF' || tag(8) !== 'WEBP') return false;
        const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
        const end = view.getUint32(4, true) + 8;
        if (end !== bytes.length) return false;
        let foundLossless = false;
        let offset = 12;
        while (offset + 8 <= end) {
            const type = tag(offset);
            const size = view.getUint32(offset + 4, true);
            const next = offset + 8 + size + (size % 2);
            if (next > end) return false;
            if (type === 'VP8 ' || type === 'ANIM' || type === 'ANMF') return false;
            if (type === 'VP8L') {
                if (foundLossless || size < 5 || bytes[offset + 8] !== 0x2f) return false;
                foundLossless = true;
            }
            offset = next;
        }
        return offset === end && foundLossless;
    }

    async function encodeCanvasImage(canvas, mimeType, quality) {
        const wantsWebp = mimeType === 'image/webp';
        const browserDefault = wantsWebp && usesBrowserWebpQuality();
        const errorCode = wantsWebp ? (browserDefault ? DOWNLOAD_ERROR_MAP.WEBP_CONVERSION_FAILED.code : DOWNLOAD_ERROR_MAP.LOSSLESS_WEBP_FAILED.code) :
            mimeType === 'image/png' ? DOWNLOAD_ERROR_MAP.PNG_CONVERSION_FAILED.code :
            DOWNLOAD_ERROR_MAP.JPEG_CONVERSION_FAILED.code;
        try {
            const blob = await new Promise((resolve, reject) => {
                const onBlob = result => {
                    if (!result) {
                        reject(new Error(errorCode));
                        return;
                    }
                    resolve(result);
                };
                if (browserDefault) canvas.toBlob(onBlob, mimeType);
                else canvas.toBlob(onBlob, mimeType, wantsWebp ? 1 : quality);
            });
            const bytes = new Uint8Array(await blob.arrayBuffer());
            if (blob.type !== mimeType || (wantsWebp && !browserDefault && !isLosslessWebp(bytes))) {
                throw new Error(errorCode);
            }
            return bytes;
        } catch (error) {
            throw new Error(errorCode, {
                cause: error
            });
        }
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

    async function downloadChapterPDF(session, files, series, chapter, setLabel, oneImagePerPage = false) {
        const checkCancelled = () => {
            if (session.cancelled) throwDownloadError('DOWNLOAD_ABORTED');
        };
        checkCancelled();
        if (!files || !Object.keys(files).length) throwDownloadError('NO_IMAGES_COLLECTED');
        try {
            setLabel(UI_BUTTON_LABELS.FINISHING);
            const pdf = await PDFLib.PDFDocument.create();
            const images = [];
            const widths = new Map();
            const entries = Object.entries(files).sort(([a], [b]) => parseInt(a, 10) - parseInt(b, 10));
            for (let i = 0; i < entries.length; i++) {
                checkCancelled();
                const image = await pdf.embedJpg(entries[i][1]);
                images.push(image);
                widths.set(image.width, (widths.get(image.width) || 0) + 1);
                await new Promise(r => setTimeout(r, 0));
            }
            if (oneImagePerPage) {
                for (const image of images) {
                    checkCancelled();
                    const scale = Math.min(0.75, 14400 / image.width, 14400 / image.height);
                    const width = image.width * scale;
                    const height = image.height * scale;
                    const page = pdf.addPage([width, height]);
                    page.drawImage(image, {
                        x: 0,
                        y: 0,
                        width,
                        height
                    });
                    await new Promise(r => setTimeout(r, 0));
                }
            } else {
                const commonWidth = [...widths].sort((a, b) => b[1] - a[1])[0][0];
                const pageWidth = Math.min(commonWidth * 0.75, 14400);
                const maxHeight = 14400;
                const heights = images.map(image => image.height * pageWidth / image.width);
                let remaining = heights.reduce((sum, height) => sum + height, 0);
                let page = null;
                let pageHeight = 0;
                let used = 0;
                for (let i = 0; i < images.length; i++) {
                    checkCancelled();
                    const height = heights[i];
                    let consumed = 0;
                    while (consumed < height - 0.000001) {
                        checkCancelled();
                        if (!page || used >= pageHeight - 0.000001) {
                            pageHeight = Math.min(maxHeight, remaining);
                            page = pdf.addPage([pageWidth, pageHeight]);
                            used = 0;
                        }
                        page.drawImage(images[i], {
                            x: 0,
                            y: pageHeight - used - height + consumed,
                            width: pageWidth,
                            height
                        });
                        const visible = Math.min(height - consumed, pageHeight - used);
                        consumed += visible;
                        used += visible;
                        remaining = Math.max(0, remaining - visible);
                    }
                    await new Promise(r => setTimeout(r, 0));
                }
            }
            checkCancelled();
            const bytes = await pdf.save();
            checkCancelled();
            const url = URL.createObjectURL(new Blob([bytes], {
                type: 'application/pdf'
            }));
            try {
                const link = document.createElement('a');
                link.href = url;
                link.download = `${series} - ${chapter}.pdf`;
                link.click();
            } finally {
                setTimeout(() => URL.revokeObjectURL(url), 60000);
            }
        } catch (error) {
            if (session.cancelled) throwDownloadError('DOWNLOAD_ABORTED');
            console.debug(`${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION} - PDF CREATION ERROR\n`, error);
            throwDownloadError('PDF_CREATION_FAILED');
        }
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
                console.debug(`${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION} - ZIP STREAMING ERROR\n`, err);
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
                    console.debug(`${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION} - ZIP FINALIZING ERROR\n`, e);
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

    async function executeDiagnosticPipeline(mainBtn, diagBtn) {
        function getDiagnosticSelectors() {
            function getElementSelector(element) {
                if (!element) return 'NOT FOUND';
                const parts = [];
                while (element && element.nodeType === 1) {
                    if (element.id) {
                        parts.unshift('#' + CSS.escape(element.id));
                        break;
                    }
                    const tagName = element.tagName;
                    let part = tagName.toLowerCase();
                    const parent = element.parentElement;
                    if (parent) {
                        const siblings = [...parent.children].filter(child => child.tagName === tagName);
                        if (siblings.length > 1) part += ':nth-of-type(' + (siblings.indexOf(element) + 1) + ')';
                    }
                    parts.unshift(part);
                    element = parent;
                }
                return parts.join(' > ');
            }
            const viewerSelector = VIEWER_CONTAINER_SELECTORS.find(value => document.querySelector(value));
            const viewer = viewerSelector ? document.querySelector(viewerSelector) : null;
            const horizontal = getHorizontalViewerType();
            const renderSelector = horizontal === 'jp' ?
                RENDER_PAGE_SELECTORS_HORIZONTAL.jp.spread :
                RENDER_PAGE_SELECTORS.find(value => document.querySelector(value));
            const render = renderSelector ? document.querySelector(renderSelector) : null;
            return {
                render: `${renderSelector ? "'" + renderSelector + "'" : 'NOT FOUND'} | { ${getElementSelector(render)} }`,
                viewer: `${viewerSelector ? "'" + viewerSelector + "'" : 'NOT FOUND'} | { ${getElementSelector(viewer)} }`
            };
        }
        if (state.ui.isDownloading) return;
        const previousOverflow = document.body.style.overflow;
        let session = null;
        let completed = false;
        try {
            state.ui.isDownloading = true;
            mainBtn.disabled = true;
            mainBtn.textContent = UI_BUTTON_LABELS.DIAGNOSING;
            diagBtn.disabled = true;
            diagBtn.textContent = UI_BUTTON_LABELS.DIAGNOSING;
            const diagStart = new Date();
            state.diagnostics.active = true;
            state.diagnostics.requests.clear();
            state.images.loggedPromoImages.clear();
            state.images.promoBlobImages.clear();
            const boolStr = v => v ? 'TRUE' : 'FALSE';
            const getDiagnosticDomains = () => {
                const domains = new Set();
                const entries = [
                    ...performance.getEntriesByType('resource'),
                    ...[...state.diagnostics.requests.values()].map(request => ({
                        name: request.url
                    })),
                    ...state.diagnostics.consoleHistory.flatMap(line => [...line.matchAll(/\bGET:\s+(https?:\/\/[^\s]+)/g)]
                        .map(match => ({
                            name: match[1]
                        })))
                ];
                entries.forEach(entry => {
                    try {
                        const url = new URL(entry.name, location.href);
                        if (!['http:', 'https:'].includes(url.protocol)) return;
                        if (entry.initiatorType !== 'img' &&
                            !/^image\//i.test(entry.contentType || '') &&
                            !(/\.(?:avif|bmp|gif|ico|jpe?g|png|svg|webp|apng|jxl)$/i.test(url.pathname) &&
                                !['script', 'audio', 'video'].includes(entry.initiatorType))) return;
                        domains.add(url.hostname);
                    } catch {}
                });
                return [...domains].sort();
            };
            let totalPageCount = 'N/A';
            let missingAfterScroll = [];
            let didFail = false;
            let caughtError = null;
            let errorMessage = '';
            try {
                session = startDownloadSession();
                state.ui.activeDownload = session;
                state.ui.phase = 'collecting';
                lockPageScroll();
                lockPageInteraction();
                scrollToTop();
                await new Promise(r => setTimeout(r, 300));
                state.viewer.initialRenderingLogged = false;
                const renderType = resolveRenderType();
                const collected = await collectChapterImages(session, renderType, () => {});
                const pageMap = collected.renderType === 'canvas' ? state.canvas.pages :
                    collected.renderType === 'blob' ? state.blob.pages : state.ui.images;
                missingAfterScroll = findMissingPages(pageMap);
                try {
                    totalPageCount = String(getTotalPageCount());
                } catch {}
            } catch (e) {
                didFail = true;
                caughtError = e;
                errorMessage = (e?.message && DOWNLOAD_ERROR_INDEX[e.message]) ?
                    DOWNLOAD_ERROR_INDEX[e.message].message :
                    (e?.message || String(e));
            }
            if (didFail || missingAfterScroll.length) {
                if (!missingAfterScroll.length) {
                    const collected = state.viewer.type === 'canvas' ?
                        state.canvas.pages :
                        state.viewer.type === 'blob' ?
                        state.blob.pages :
                        state.ui.images;
                    missingAfterScroll = findMissingPages(collected);
                }
            }
            const missingIndexes = new Set(missingAfterScroll);
            const missingPageHtml = getIndexedComicCuts()
                .filter(cut =>
                    missingIndexes.has(Number(cut.dataset.cutIndex))
                )
                .map(cut =>
                    `MISSING IMAGE (data-cut-index: ${cut.dataset.cutIndex}): ` +
                    cut.outerHTML
                );
            missingPageHtml.forEach(html => {
                console.warn(`${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION} - ${html}`);
            });
            const promoBlobHtml = [...state.images.promoBlobImages.values()];
            promoBlobHtml.forEach(html => {
                console.warn(`${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION} - ${html}`);
            });
            const diagnosticDomains = getDiagnosticDomains();
            state.diagnostics.active = false;
            const diagLogs = [...state.diagnostics.consoleHistory];
            const ts = diagStart.toISOString().replace('T', ' ').slice(0, 23);
            const matchedSelectors = getDiagnosticSelectors();
            const lines = [
                `--- GENERATED ${ts} ---`,
                '',
                `SCRIPT_NAME: ${SCRIPT_NAME_DEBUG}`,
                `SCRIPT_VERSION: v${SCRIPT_VERSION}`,
                'USER_AGENT: ' + navigator.userAgent,
                'CHAPTER_URL: ' + location.href,
                `IMAGE_DOMAINS: ${diagnosticDomains.length ? diagnosticDomains.join(', ') : 'NONE'}`,
                '',
                '-- INITIAL DIAGNOSIS --',
                '',
                `RENDER_PAGE_SELECTORS: ${matchedSelectors.render}`,
                `VIEWER_PAGE_SELECTORS: ${matchedSelectors.viewer}`,
                '',
                `TOTAL_PAGE_COUNT: { ${totalPageCount} }`,
                `SERIES_TITLE: { ${getSeriesTitle()} }`,
                `SERIES_CHAPTER: { ${getSeriesChapter()} }`,
                `RENDER_TYPE: ${(state.viewer.type || 'NULL').toUpperCase()}`,
                `SAVE_AS_PDF: ${boolStr(localStorage.getItem(STORAGE_KEY_SAVE_AS_PDF) === 'true')}`,
                `SMALL_FILE_SIZE: ${boolStr(localStorage.getItem(STORAGE_KEY_SMALL_FILE_SIZE) === 'true')}`,
                `WEBP_QUALITY: ${usesBrowserWebpQuality() ? 'BROWSER_DEFAULT' : 'MAX_QUALITY'}`,
                `WEBP_QUALITY_ACTIVE: ${boolStr(localStorage.getItem(STORAGE_KEY_SAVE_AS_PDF) !== 'true' && localStorage.getItem(STORAGE_KEY_SMALL_FILE_SIZE) === 'true')}`,
                '',
                `IS_CHAPTER_PAGE: ${boolStr(isChapterPage())}`,
                `IS_ALTERNATE_LAYOUT: ${boolStr(isAlternateViewerLayout())}`,
                `IS_HORIZONTAL_LAYOUT: ${boolStr(isHorizontalViewerLayout())}`,
                `IS_MOBILE_DEVICE: ${boolStr(IS_MOBILE_DEVICE)}`,
                `HAS_PURCHASE_MODAL: ${boolStr(hasPurchaseModal())}`,
                `FOOTER_ELEMENT_PRESENT: ${boolStr(!!document.querySelector(UI_PAGE_SELECTORS.footer))}`,
                `REFRESH_KEY_PRESENT: ${boolStr(!!sessionStorage.getItem(STORAGE_KEY_AUTO_REFRESH))}`,
                `CANVAS_HOOK_ACTIVE: ${boolStr(!!CanvasRenderingContext2D.prototype.__lezhinHooked)}`,
                `MISSING_INDEXES: ${missingAfterScroll.length ? missingAfterScroll.join(', ') : 'NONE'}`,
                '',
                '-- DEVELOPER CONSOLE --',
                '',
                ...diagLogs,
                '',
                ...(missingPageHtml.length ? [
                    '-- MISSING IMAGE HTML --',
                    '',
                    ...missingPageHtml,
                    ''
                ] : []),
                ...(promoBlobHtml.length ? [
                    '-- PROMO BLOBS IMAGE HTML --',
                    '',
                    ...promoBlobHtml,
                    ''
                ] : []),
                '-- SUMMARY RESULTS --',
                '',
                didFail ?
                'OVERALL: FAIL' :
                `OVERALL: ${missingAfterScroll.length === 0 ? 'PASS' : `PARTIAL (MISSING: ${missingAfterScroll.join(', ')})`}`,
                ...(didFail ? [`ERROR: ${errorMessage}`] : []),
                ''
            ];
            try {
                const blob = new Blob([lines.join('\n')], {
                    type: 'text/plain'
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Offline for Lezhin Debug v${SCRIPT_VERSION}.log`;
                a.click();
                setTimeout(() => URL.revokeObjectURL(url), 1000);
            } catch (error) {
                throw error;
            }
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
                completed = true;
            }
        } catch (error) {
            try {
                handleDownloadError(error);
            } catch (reportError) {}
        } finally {
            const cleanup = action => {
                try {
                    action();
                } catch (cleanupError) {}
            };
            cleanup(() => {
                if (session) session.cancel();
            });
            state.diagnostics.active = false;
            state.canvas.enabled = false;
            state.blob.enabled = false;
            state.ui.phase = 'idle';
            state.ui.isDownloading = false;
            if (state.ui.activeDownload === session) state.ui.activeDownload = null;
            cleanup(() => {
                document.body.style.overflow = previousOverflow;
            });
            cleanup(() => {
                document.body.classList.remove('lock-site-ui');
            });
            cleanup(() => hideDimOverlay());
            cleanup(() => {
                mainBtn.disabled = false;
            });
            cleanup(() => {
                diagBtn.disabled = false;
            });
            cleanup(() => {
                mainBtn.textContent = UI_BUTTON_LABELS.DEFAULT;
            });
            cleanup(() => {
                diagBtn.textContent = completed ? UI_BUTTON_LABELS.COMPLETE : UI_BUTTON_LABELS.DIAG_DEFAULT;
            });
        }
    }

    function recordConsoleHistory() {
        function formatMessage(args) {
            const firstArg = typeof args[0] === 'string' ? args[0] : '';
            if (!firstArg.includes(SCRIPT_NAME_DEBUG)) return null;
            let fmt = firstArg;
            const rest = args.slice(1);
            fmt = fmt.replace(/%c/g, () => {
                rest.shift();
                return '';
            });
            const extras = rest.map(arg => {
                if (typeof arg === 'string') return arg;
                try {
                    return JSON.stringify(arg);
                } catch {
                    return String(arg);
                }
            });
            const cleaned = [fmt, ...extras].join(' ').trim().replace(
                new RegExp(`${SCRIPT_NAME_DEBUG} v[\\d.]+ - `, 'g'),
                ''
            );
            const ts = new Date().toISOString().replace('T', ' ').slice(0, 23);
            return `[${ts}] ${cleaned}`;
        }
        if (window.__lezhinConsoleHistoryInstalled) return;
        window.__lezhinConsoleHistoryInstalled = true;
        ['log', 'debug', 'warn', 'error'].forEach(level => {
            const original = console[level].bind(console);
            console[level] = function(...args) {
                original(...args);
                const entry = formatMessage(args);
                if (!entry) return;
                state.diagnostics.consoleHistory.push(entry);
                if (state.diagnostics.consoleHistory.length > 1000) {
                    state.diagnostics.consoleHistory.shift();
                }
            };
        });
    }

    function recordDiagnosticRequest(type, url, details = '', log = true) {
        if (!state.diagnostics.active || !url) return;
        const key = `${type}|${url}`;
        const existing = state.diagnostics.requests.get(key);
        if (existing && !details) return;
        const request = existing || {
            type,
            url
        };
        request.details = details;
        state.diagnostics.requests.set(key, request);
        if (!log) return;
        console.debug(
            `${SCRIPT_NAME_DEBUG} v${SCRIPT_VERSION} - ${type}: ${url}` +
            (details ? ` ${details}` : '')
        );
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
                const method = resource instanceof Request ? resource.method :
                    (arguments[1]?.method || 'GET');
                recordDiagnosticRequest(method, url, '', false);
                try {
                    handleBlock(url, 'fetch');
                } catch (e) {
                    return Promise.reject(new TypeError('blocked-request'));
                }
                return origFetch.apply(this, arguments).then(
                    response => {
                        recordDiagnosticRequest(
                            method,
                            url,
                            `HTTP/${response.status} ${response.statusText}`.trim()
                        );
                        return response;
                    },
                    error => {
                        recordDiagnosticRequest(method, url, 'HTTP/0 NETWORK ERROR');
                        throw error;
                    }
                );
            };
        }
        const origOpen = XMLHttpRequest.prototype.open;
        const origSend = XMLHttpRequest.prototype.send;
        XMLHttpRequest.prototype.open = function(method, url) {
            const host = getHostname(url);
            this.__requestMethod = method;
            this.__requestURL = url;
            if (shouldBlock(host)) {
                this.__blocked = true;
                this.__url = url;
                this.__host = host;
            }
            return origOpen.apply(this, arguments);
        };
        XMLHttpRequest.prototype.send = function() {
            recordDiagnosticRequest(
                this.__requestMethod || 'GET',
                this.__requestURL,
                '',
                false
            );
            if (!this.__diagnosticResponseListenerAttached) {
                this.__diagnosticResponseListenerAttached = true;
                this.addEventListener('loadend', () => {
                    recordDiagnosticRequest(
                        this.__requestMethod || 'GET',
                        this.__requestURL,
                        `HTTP/${this.status || 0} ${this.statusText || ''}`.trim()
                    );
                });
            }
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

    recordConsoleHistory();
    window.addEventListener('load', init);

})();