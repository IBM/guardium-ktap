/**
 * K-TAP Package Finder - Frontend Application
 * Integrated with /api/match-kernel endpoint for EXACT and EXACT-LIKE matching
 */

// Global state
let allPackages = [];
let filteredPackages = [];
let currentPage = 1;
const itemsPerPage = 20;

// DOM Elements
const kernelInput = document.getElementById('kernel-input');
const guardiumVersionSelect = document.getElementById('guardium-version');
const operatingSystemSelect = document.getElementById('operating-system');
const filterBtn = document.getElementById('filter-btn');
const resetBtn = document.getElementById('reset-btn');
const exportCsvBtn = document.getElementById('export-csv-btn');
const resultsBody = document.getElementById('results-body');
const resultsContainer = document.getElementById('results-container');
const loadingDiv = document.getElementById('loading');
const noResultsDiv = document.getElementById('no-results');
const paginationDiv = document.getElementById('pagination');

/**
 * Initialize the application on page load
 */
document.addEventListener('DOMContentLoaded', function() {
    console.log('K-TAP Package Finder initialized with kernel matching');
    
    // Set up collapsible section toggles
    const sectionToggleBtns = document.querySelectorAll('.section-toggle-btn');
    
    sectionToggleBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
            const targetId = btn.getAttribute('data-target');
            const targetContent = document.getElementById(targetId);
            const isExpanded = btn.getAttribute('aria-expanded') === 'true';
            
            if (targetContent) {
                if (isExpanded) {
                    // Collapse
                    targetContent.classList.add('collapsed');
                    btn.setAttribute('aria-expanded', 'false');
                } else {
                    // Expand
                    targetContent.classList.remove('collapsed');
                    btn.setAttribute('aria-expanded', 'true');
                }
            }
        });
    });
    
    // Load filter options (versions and platforms)
    loadFilterOptions();
    
    // Set up event listeners
    filterBtn.addEventListener('click', applyFilters);
    resetBtn.addEventListener('click', resetFilters);
    exportCsvBtn.addEventListener('click', exportToCSV);
    
    // Auto-detect platform when kernel is entered
    kernelInput.addEventListener('blur', autoDetectPlatform);
    
    // Allow Enter key in kernel input to trigger filter
    kernelInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            applyFilters();
        }
    });
});

/**
 * Load available filter options from the backend
 */
// async function loadFilterOptions() {
//     try {
//         const response = await fetch('/api/filters');
//         const data = await response.json();
        
//         // Populate Guardium version dropdown
//         guardiumVersionSelect.innerHTML = '<option value="">Select Version</option>';
//         data.versions.forEach(version => {
//             const option = document.createElement('option');
//             option.value = version;
//             option.textContent = version;
//             guardiumVersionSelect.appendChild(option);
//         });
        
//         // Populate Operating System dropdown
//         operatingSystemSelect.innerHTML = '<option value="">Select Platform</option>';
//         data.platforms.forEach(platform => {
//             const option = document.createElement('option');
//             option.value = platform;
//             option.textContent = platform;
//             operatingSystemSelect.appendChild(option);
//         });
        
//         console.log('Filter options loaded:', data);
//     } catch (error) {
//         console.error('Error loading filter options:', error);
//         showError('Failed to load filter options. Please refresh the page.');
//     }
// }
async function loadFilterOptions() {

    try {

        const response =
            await fetch('/static/packages.json');

        const data =
            await response.json();

        allPackages =
            data.packages || [];

        const versions =
            [...new Set(
                allPackages.map(
                    p => p.guardium_version
                )
            )]
            .sort()
            .reverse();

        const platforms =
            [...new Set(
                allPackages.map(
                    p => p.platform
                )
            )]
            .sort();

        guardiumVersionSelect.innerHTML =
            '<option value="">Select Version</option>';

        versions.forEach(version => {

            const option =
                document.createElement('option');

            option.value = version;

            option.textContent = version;

            guardiumVersionSelect.appendChild(option);
        });

        operatingSystemSelect.innerHTML =
            '<option value="">Select Platform</option>';

        platforms.forEach(platform => {

            const option =
                document.createElement('option');

            option.value = platform;

            option.textContent = platform;

            operatingSystemSelect.appendChild(option);
        });

    }
    catch (error) {

        console.error(
            'Error loading packages.json:',
            error
        );

        showError(
            'Failed to load packages.json'
        );
    }
}
function autoDetectPlatformFromKernel(
    kernel
) {

    if (/\.el9/.test(kernel))
        return 'rhel-9-linux-x86-64';

    if (/\.el8/.test(kernel))
        return 'rhel-8-linux-x86-64';

    if (/\.el7/.test(kernel))
        return 'rhel-7-linux-x86-64';

    if (/ubuntu|generic/.test(kernel))
        return 'ubuntu-22-linux-x86-64';

    if (/amzn2023/.test(kernel))
        return 'amzn-2023-linux-x86-64';

    return '';
}

/**
 * Auto-detect platform from kernel input
 */
// async function autoDetectPlatform() {
//     const kernel = kernelInput.value.trim();
    
//     if (!kernel) {
//         return;
//     }
    
//     try {
//         const response = await fetch(`/api/identify-kernel?kernel=${encodeURIComponent(kernel)}`);
//         const data = await response.json();
        
//         if (data.success && data.platform) {
//             // Auto-select the detected platform
//             operatingSystemSelect.value = data.platform;
//             console.log(`Auto-detected platform: ${data.platform}`);
            
//             // Show a subtle notification
//             showNotification(`Detected platform: ${data.platform}`, 'info');
//         }
//     } catch (error) {
//         console.error('Error detecting platform:', error);
//     }
// }

function autoDetectPlatform() {

    const kernel =
        kernelInput.value.trim();

    if (!kernel)
        return;

    const platform =
        autoDetectPlatformFromKernel(
            kernel
        );

    if (platform) {

        operatingSystemSelect.value =
            platform;

        showNotification(
            `Detected platform: ${platform}`,
            'info'
        );
    }
}

/**
 * Apply filters and perform kernel matching
 */
// async function applyFilters() {
//     const kernel = kernelInput.value.trim();
//     const version = guardiumVersionSelect.value;
//     const platform = operatingSystemSelect.value;
    
//     // Validate that both version and platform are selected
//     if (!version || !platform) {
//         showValidationError(version, platform);
//         return;
//     }
    
//     // Use new /api/match-kernel for specific version+platform
//     showLoading();
    
//     try {
//         // Build query parameters
//         const params = new URLSearchParams();
//         if (kernel) params.append('kernel', kernel);
//         params.append('version', version);
//         params.append('platform', platform);
        
//         const response = await fetch(`/api/match-kernel?${params.toString()}`);
//         const data = await response.json();
        
//         // Handle errors
//         if (!response.ok) {
//             if (data.error === 'Kernel and platform mismatch') {
//                 showMismatchWarning(data);
//                 return;
//             }
//             throw new Error(data.error || 'Failed to match kernel');
//         }
        
//         // Success - display results
//         filteredPackages = data.results || [];
//         currentPage = 1;
        
//         console.log(`Found ${filteredPackages.length} matches`);
        
//         if (filteredPackages.length === 0) {
//             showNoResults();
//         } else {
//             displayResults(data, kernel);
//         }
        
//     } catch (error) {
//         console.error('Error applying filters:', error);
//         showError(error.message || 'Failed to match kernel. Please try again.');
//     }
// }

async function applyFilters() {

    const kernel =
        kernelInput.value.trim();

    const version =
        guardiumVersionSelect.value;

    const platform =
        operatingSystemSelect.value;

    if (!version || !platform) {

        showValidationError(
            version,
            platform
        );

        return;
    }

    showLoading();

    const detectedPlatform =
        autoDetectPlatformFromKernel(
            kernel
        );

    if (
        kernel &&
        detectedPlatform &&
        detectedPlatform !== platform
    ) {

        showMismatchWarning({
            kernel: kernel,
            selected_platform: platform,
            detected_platform: detectedPlatform,
            warning:
                `Kernel '${kernel}' belongs to '${detectedPlatform}' but you selected '${platform}'.`
        });

        return;
    }

    let results =
        allPackages.filter(pkg => {

            const versionMatch =
                pkg.guardium_version === version;

            const platformMatch =
                pkg.platform === platform;

            const kernelMatch =
                !kernel ||
                pkg.kernel.includes(kernel);

            return (
                versionMatch &&
                platformMatch &&
                kernelMatch
            );
        });

    // Keep latest revisions only
    const latestMap = {};
    
    results.forEach(pkg => {

        const key = [
          pkg.guardium_version,
          pkg.platform,
          pkg.kernel,
          pkg.match_type,
          pkg.mapped_from_kernel || '',
          pkg.matched_ko || ''
        ].join('|');

     const existing = latestMap[key];

        if (!existing) {

         latestMap[key] = pkg;
         return;
     }

     const currentRev =
         parseInt(pkg.stap_revision || 0);

        const existingRev =
         parseInt(existing.stap_revision || 0);

        // Higher revision wins
        if (currentRev > existingRev) {

         latestMap[key] = pkg;
         return;
        }

        // EXACT beats EXACT-LIKE
        if (
         currentRev === existingRev &&
            existing.match_type === 'EXACT-LIKE' &&
         pkg.match_type === 'EXACT'
        ) {

            latestMap[key] = pkg;
     }
    });

    filteredPackages =
        Object.values(latestMap);

    currentPage = 1;

    if (!filteredPackages.length) {

        showNoResults();

        return;
    }

    displayResults(
        {
            results: filteredPackages,
            package_info: {
                name:
                    filteredPackages[0]
                        .package_name || '',
                revision:
                    filteredPackages[0]
                        .stap_revision || '',
                date:
                    filteredPackages[0]
                        .publish_date || ''
            },
            query: {
                kernel: kernel
            }
        },
        kernel
    );
}

/**
 * Show validation error when required selections are missing
 */
function showValidationError(version, platform) {
    hideLoading();
    resultsContainer.style.display = 'none';
    
    let errorMessage = '<div class="error-box"><h3>⚠️ Selection Required</h3><ul style="text-align: left; margin: 10px 0;">';
    
    if (!version) {
        errorMessage += '<li><strong>Please select a Guardium Version</strong></li>';
    }
    if (!platform) {
        errorMessage += '<li><strong>Please select an Operating System</strong></li>';
    }
    
    errorMessage += '</ul><p>Both selections are required to search for K-TAP packages.</p></div>';
    
    noResultsDiv.innerHTML = errorMessage;
    noResultsDiv.style.display = 'block';
}

/**
 * Show kernel-platform mismatch warning
 */
function showMismatchWarning(data) {
    hideLoading();
    resultsContainer.style.display = 'none';
    
    noResultsDiv.innerHTML = `
        <div class="error-box">
            <h3>⚠️ Kernel and Platform Mismatch</h3>
            <p><strong>Kernel:</strong> ${escapeHtml(data.kernel)}</p>
            <p><strong>Selected Platform:</strong> ${escapeHtml(data.selected_platform)}</p>
            <p><strong>Detected Platform:</strong> ${escapeHtml(data.detected_platform)}</p>
            <p class="warning-message">${escapeHtml(data.warning)}</p>
            <button class="btn btn-primary" onclick="fixPlatformMismatch('${data.detected_platform}')">
                Use Detected Platform: ${escapeHtml(data.detected_platform)}
            </button>
        </div>
    `;
    noResultsDiv.style.display = 'block';
}

/**
 * Fix platform mismatch by selecting the correct platform
 */
window.fixPlatformMismatch = function(platform) {
    operatingSystemSelect.value = platform;
    applyFilters();
};

/**
 * Reset all filters
 */
function resetFilters() {
    kernelInput.value = '';
    guardiumVersionSelect.value = '';
    operatingSystemSelect.value = '';
    
    filteredPackages = [];
    hideLoading();
    resultsContainer.style.display = 'none';
    noResultsDiv.style.display = 'none';
}

/**
 * Display results in the table with pagination
 */
function displayResults(data, userKernel = '') {
    if (filteredPackages.length === 0) {
        showNoResults();
        return;
    }
    
    // Calculate pagination
    const totalPages = Math.ceil(filteredPackages.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pagePackages = filteredPackages.slice(startIndex, endIndex);
    
    // Clear existing results
    resultsBody.innerHTML = '';
    
    // Populate table
    pagePackages.forEach(pkg => {
        const row = document.createElement('tr');
        
        // Format match type with badge
        const matchTypeBadge = getMatchTypeBadge(pkg.match_type);
        
        // Extract kernel version from matched_ko filename
        let kernelCell = '';
        let ktapModuleCell = '';
        
        if (pkg.matched_ko) {
            // Extract just the filename from the full path
            const koFilename = pkg.matched_ko.split('/').pop();
            
            // Display the full KTAP module filename in the KTAP Module column
            ktapModuleCell = `<span class="ktap-module">${escapeHtml(koFilename)}</span>`;
            
            // For EXACT-LIKE matches, show user's input kernel with mapped info
            // For EXACT matches, extract kernel from filename
            if (pkg.match_type === 'EXACT-LIKE') {

    // Always show actual kernel from packages.json
    kernelCell = escapeHtml(pkg.kernel || 'N/A');

    // Always show mapping details
    if (pkg.mapped_from_kernel) {
        kernelCell += `
            <br>
            <small class="mapped-info">
                → Mapped from: ${escapeHtml(pkg.mapped_from_kernel)}
            </small>
        `;
    }

} else {
                // Extract kernel version from the filename for EXACT matches
                // Pattern: ktap-12.1.3.0_r122091_v12_1_1-rh8x64m-4.18.0-147.3.1.el8_1.x86_64-x86_64-SMP.ko
                // We want: 4.18.0-147.3.1.el8_1.x86_64
                // Strategy: Find the platform code (like rh8x64m, oe8u10x64m), then take everything after it
                // until we hit x86_64-SMP or SMP
                
                // Remove .ko extension if present
                let filename = koFilename.replace(/\.ko$/, '');
                
                // Split by hyphens
                const parts = filename.split('-');
                
                // Find platform code pattern (ends with 'x64m' or similar)
                // Examples: rh8x64m, rh8u2x64m, oe8u10x64m, rh9u4x64m
                let kernelStartIndex = -1;
                for (let i = 0; i < parts.length; i++) {
                    // Platform codes typically end with x64m, x86m, etc.
                    if (/^[a-z0-9_-]+(x64m|arm64|vm\d+m\d*|m\d*)$/.test(parts[i])) {
                        // Found platform code, kernel version starts at next part
                        kernelStartIndex = i + 1;
                        break;
                    }
                }
                
                if (kernelStartIndex !== -1 && kernelStartIndex < parts.length) {
                    // Collect all parts from kernel start until x86_64 or SMP
                    const kernelParts = [];
                    for (let j = kernelStartIndex; j < parts.length; j++) {
                        // Stop at architecture suffix followed by SMP
                        if (['x86_64', 'aarch64', 'ppc64le', 's390x'].includes(parts[j]) &&
                            j + 1 < parts.length && parts[j + 1] === 'SMP') {
                            break;
                        }
                        if (parts[j] === 'SMP') {
                            break;
                        }
                        kernelParts.push(parts[j]);
                    }
                    
                    if (kernelParts.length > 0) {
                        kernelCell = escapeHtml(kernelParts.join('-'));
                    } else {
                        // Fallback
                        kernelCell = escapeHtml(parts[parts.length - 1]);
                    }
                } else {
                    // Fallback: use the last part
                    kernelCell = escapeHtml(parts[parts.length - 1]);
                }
            }
        } else {
            // No matched_ko available, use original kernel value
            kernelCell = escapeHtml(pkg.kernel || 'N/A');
            if (pkg.match_type === 'EXACT-LIKE' && pkg.mapped_from_kernel) {
                kernelCell += `<br><small class="mapped-info">→ Uses: ${escapeHtml(pkg.mapped_from_kernel)}</small>`;
            }
            ktapModuleCell = '<span class="no-module">N/A</span>';
        }
        
        row.innerHTML = `
            <td>${escapeHtml(pkg.guardium_version)}</td>
            <td>${escapeHtml(pkg.stap_revision)}</td>
            <td>${escapeHtml(pkg.platform)}</td>
            <td>${kernelCell}</td>
            <td>${matchTypeBadge}</td>
            <td>${ktapModuleCell}</td>
        `;
        
        resultsBody.appendChild(row);
    });
    
    // Show package info banner
    if (data.package_info) {
        showPackageInfo(data.package_info, data.query);
    }
    
    // Update pagination
    updatePagination(totalPages);
    
    // Show results
    hideLoading();
    resultsContainer.style.display = 'block';
}

/**
 * Show package information banner
 */
function showPackageInfo(packageInfo, query) {
    let infoBanner = document.getElementById('package-info-banner');
    
    if (!infoBanner) {
        infoBanner = document.createElement('div');
        infoBanner.id = 'package-info-banner';
        infoBanner.className = 'info-banner';
        resultsContainer.insertBefore(infoBanner, resultsContainer.firstChild);
    }
    
    const kernelText = query.kernel || 'Any kernel';
    
    infoBanner.innerHTML = `
        <strong>Bundler Package:</strong> ${escapeHtml(packageInfo.name)} |
        <strong>Revision:</strong> ${escapeHtml(packageInfo.revision)} |
        <strong>Publish Date:</strong> ${escapeHtml(packageInfo.date)} |
        <strong>Kernel:</strong> ${escapeHtml(kernelText)}
    `;
}

/**
 * Get HTML for match type badge
 */
function getMatchTypeBadge(matchType) {
    if (!matchType) return '';
    
    const type = matchType.toUpperCase();
    
    if (type === 'EXACT') {
        return '<span class="match-exact" title="Direct kernel match found">EXACT</span>';
    } else if (type === 'EXACT-LIKE') {
        return '<span class="match-exact-like" title="Kernel mapped via ktap-combos.txt">EXACT-LIKE</span>';
    } else if (type === 'AVAILABLE') {
        return '<span class="match-available" title="Available in package">AVAILABLE</span>';
    } else if (type === 'NO_MATCH') {
        return '<span class="match-no-match" title="No matching kernel found">NO MATCH</span>';
    } else if (type === 'BROWSE' || type === 'TBD') {
        return '<span class="match-browse" title="Browse mode - no kernel matching performed">BROWSE</span>';
    } else {
        return `<span class="match-other">${escapeHtml(matchType)}</span>`;
    }
}

/**
 * Update pagination controls
 */
function updatePagination(totalPages) {
    paginationDiv.innerHTML = '';
    
    if (totalPages <= 1) {
        return;
    }
    
    // Previous button
    const prevBtn = document.createElement('button');
    prevBtn.textContent = '← Previous';
    prevBtn.className = 'btn btn-secondary';
    prevBtn.disabled = currentPage === 1;
    prevBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayResults({ results: filteredPackages });
        }
    });
    paginationDiv.appendChild(prevBtn);
    
    // Page info
    const pageInfo = document.createElement('span');
    pageInfo.className = 'page-info';
    pageInfo.textContent = `Page ${currentPage} of ${totalPages} (${filteredPackages.length} results)`;
    paginationDiv.appendChild(pageInfo);
    
    // Next button
    const nextBtn = document.createElement('button');
    nextBtn.textContent = 'Next →';
    nextBtn.className = 'btn btn-secondary';
    nextBtn.disabled = currentPage === totalPages;
    nextBtn.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            displayResults({ results: filteredPackages });
        }
    });
    paginationDiv.appendChild(nextBtn);
}

/**
 * Export filtered results to CSV
 */
// function exportToCSV() {
//     const kernel = kernelInput.value.trim();
//     const version = guardiumVersionSelect.value;
//     const platform = operatingSystemSelect.value;
    
//     // Validation
//     if (!version || !platform) {
//         showError('Please select version and platform before exporting');
//         return;
//     }
    
//     // Build query parameters
//     const params = new URLSearchParams();
//     if (kernel) params.append('kernel', kernel);
//     params.append('version', version);
//     params.append('platform', platform);
//     params.append('format', 'csv');
    
//     // Trigger download
//     window.location.href = `/api/match-kernel?${params.toString()}`;
// }
function exportToCSV() {

    if (!filteredPackages.length) {

        showError(
            'No results to export'
        );

        return;
    }

    let csv =
    'Guardium Version,Stap Revision,Platform,Kernel,Match Type,KTAP Module,Mapped From Kernel,Publish Date,Bundle Package\n';
    filteredPackages.forEach(pkg => {

        csv +=
            `"${pkg.guardium_version || ''}",`;

        csv +=
            `"${pkg.stap_revision || ''}",`;

        csv +=
            `"${pkg.platform || ''}",`;

        csv +=
            `"${pkg.kernel || ''}",`;

        csv +=
            `"${pkg.match_type || ''}",`;

        csv +=
             `"${pkg.matched_ko || ''}",`;

        csv +=
            `"${pkg.mapped_from_kernel || ''}",`;

        csv +=
            `"${pkg.publish_date || ''}",`;

        csv +=
            `"${pkg.package_name || ''}"\n`;
            });

    const blob =
        new Blob(
            [csv],
            {
                type: 'text/csv'
            }
        );

    const url =
        URL.createObjectURL(blob);

    const a =
        document.createElement('a');

    a.href = url;

    a.download =
        `ktap_match_${guardiumVersionSelect.value}_${operatingSystemSelect.value}.csv`;

    document.body.appendChild(a);

    a.click();

    document.body.removeChild(a);

    URL.revokeObjectURL(url);
}

/**
 * Show loading indicator
 */
function showLoading() {
    loadingDiv.style.display = 'block';
    loadingDiv.textContent = 'Processing... This may take 20-50 seconds for package extraction and analysis.';
    resultsContainer.style.display = 'none';
    noResultsDiv.style.display = 'none';
}

/**
 * Hide loading indicator
 */
function hideLoading() {
    loadingDiv.style.display = 'none';
}

/**
 * Show no results message
 */
function showNoResults() {
    hideLoading();
    resultsContainer.style.display = 'none';
    noResultsDiv.innerHTML = '<p>No matching kernels found for the selected criteria.</p>';
    noResultsDiv.style.display = 'block';
}

/**
 * Show error message
 */
function showError(message) {
    hideLoading();
    resultsContainer.style.display = 'none';
    noResultsDiv.innerHTML = `<div class="error-box"><strong>Error:</strong> ${escapeHtml(message)}</div>`;
    noResultsDiv.style.display = 'block';
}

/**
 * Show notification message
 */
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        notification.remove();
    }, 3000);
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

// Made with Bob - Updated for kernel matching