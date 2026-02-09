/**
 * UIAdapter - Adapts existing functional modules to the new Graphite UI
 * Provides a bridge between legacy components and the modern template design
 */

class UIAdapter {
    /**
     * Adapt file upload component to new UI
     * Adds drag-and-drop functionality and enhanced visual feedback
     * @param {Object} fileUploadComponent - The file upload component instance
     */
    static adaptFileUpload(fileUploadComponent) {
        if (!fileUploadComponent || !fileUploadComponent.initializeUI) {
            console.error('Invalid file upload component');
            return;
        }

        // Store original initialize method
        const originalInitialize = fileUploadComponent.initializeUI.bind(fileUploadComponent);
        
        // Override initializeUI to add drag-and-drop functionality
        fileUploadComponent.initializeUI = function(elements) {
            // Call original initialization
            originalInitialize(elements);
            
            // Add drag-and-drop enhancements
            if (elements.fileInput && elements.fileInput.parentElement) {
                const dropZone = elements.fileInput.parentElement;
                
                // Add drop-zone class for styling
                dropZone.classList.add('drop-zone');
                
                // Prevent default drag behaviors
                const preventDefaults = (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                };
                
                ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
                    dropZone.addEventListener(eventName, preventDefaults, false);
                });
                
                // Highlight drop zone when item is dragged over it
                ['dragenter', 'dragover'].forEach(eventName => {
                    dropZone.addEventListener(eventName, () => {
                        dropZone.classList.add('drag-over');
                    }, false);
                });
                
                // Remove highlight when item leaves or is dropped
                ['dragleave', 'drop'].forEach(eventName => {
                    dropZone.addEventListener(eventName, () => {
                        dropZone.classList.remove('drag-over');
                    }, false);
                });
                
                // Handle dropped files
                dropZone.addEventListener('drop', (e) => {
                    const files = e.dataTransfer.files;
                    if (files.length > 0) {
                        // Set the files to the input element
                        elements.fileInput.files = files;
                        // Trigger change event to process the file
                        elements.fileInput.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }, false);
            }
            
            // Enhance progress bar styling
            if (elements.progressBar) {
                elements.progressBar.classList.add('progress-bar-enhanced');
            }
        };
    }
    
    /**
     * Adapt status monitor component to new UI
     * Adds visual icons and enhanced status indicators
     * @param {Object} statusMonitorComponent - The status monitor component instance
     */
    static adaptStatusMonitor(statusMonitorComponent) {
        if (!statusMonitorComponent || !statusMonitorComponent.updateStatusDisplay) {
            console.error('Invalid status monitor component');
            return;
        }

        // Store original updateStatusDisplay method
        const originalUpdateStatus = statusMonitorComponent.updateStatusDisplay.bind(statusMonitorComponent);
        
        // Override updateStatusDisplay to add icons
        statusMonitorComponent.updateStatusDisplay = function(status, run = null) {
            // Call original update
            originalUpdateStatus(status, run);
            
            // Add status icons
            if (this.elements && this.elements.statusIndicator) {
                const indicator = this.elements.statusIndicator;
                
                // Icon mapping for different statuses
                const iconMap = {
                    'not_started': '⚪',
                    'queued': '⏳',
                    'in_progress': '⚙️',
                    'completed': '✅',
                    'failed': '❌',
                    'cancelled': '🚫',
                    'unknown': '❓'
                };
                
                const icon = iconMap[status] || iconMap['unknown'];
                
                // Get current text content
                const currentText = indicator.textContent || '';
                
                // Only add icon if not already present
                if (!currentText.startsWith(icon)) {
                    // Remove any existing icon (emoji at start)
                    const textWithoutIcon = currentText.replace(/^[\u{1F300}-\u{1F9FF}][\u{FE00}-\u{FE0F}]?\s*/u, '');
                    indicator.textContent = `${icon} ${textWithoutIcon}`;
                }
                
                // Add enhanced visual styling
                indicator.classList.add('status-enhanced');
            }
        };
    }
    
    /**
     * Adapt log viewer component to new UI
     * Adds syntax highlighting for log content
     * @param {Object} logViewerComponent - The log viewer component instance
     */
    static adaptLogViewer(logViewerComponent) {
        if (!logViewerComponent || !logViewerComponent.updateDisplay) {
            console.error('Invalid log viewer component');
            return;
        }

        // Store original updateDisplay method
        const originalUpdateDisplay = logViewerComponent.updateDisplay.bind(logViewerComponent);
        
        // Override updateDisplay to add syntax highlighting
        logViewerComponent.updateDisplay = function() {
            // Call original update
            originalUpdateDisplay();
            
            // Apply syntax highlighting
            if (this.elements && this.elements.logViewer) {
                this.highlightLogSyntax(this.elements.logViewer);
            }
        };
        
        // Add highlightLogSyntax method to the component
        logViewerComponent.highlightLogSyntax = function(element) {
            if (!element) return;
            
            let html = element.innerHTML;
            
            // Highlight error patterns (red)
            html = html.replace(
                /(ERROR|FAILED|Exception|Error:|Failed:|Traceback|\[ERROR\]|\[FAIL\])/gi,
                '<span class="log-error">$1</span>'
            );
            
            // Highlight success patterns (green)
            html = html.replace(
                /(SUCCESS|COMPLETED|Done|Passed|\[SUCCESS\]|\[PASS\]|✓)/gi,
                '<span class="log-success">$1</span>'
            );
            
            // Highlight step markers (blue/cyan)
            html = html.replace(
                /(===\s*STEP\s+\d+:.*?===|^STEP\s+\d+:.*$|^Step\s+\d+:.*$)/gim,
                '<span class="log-step">$1</span>'
            );
            
            // Highlight warnings (yellow/orange)
            html = html.replace(
                /(WARNING|WARN|Caution|\[WARN\]|\[WARNING\])/gi,
                '<span class="log-warning">$1</span>'
            );
            
            // Highlight info markers (light blue)
            html = html.replace(
                /(INFO|Information|\[INFO\])/gi,
                '<span class="log-info">$1</span>'
            );
            
            element.innerHTML = html;
        };
    }
    
    /**
     * Initialize all UI adaptations
     * Convenience method to adapt all components at once
     * @param {Object} components - Object containing all component instances
     * @param {Object} components.fileUpload - File upload component
     * @param {Object} components.statusMonitor - Status monitor component
     * @param {Object} components.logViewer - Log viewer component
     */
    static initializeAll(components) {
        if (!components) {
            console.error('No components provided for adaptation');
            return;
        }
        
        try {
            if (components.fileUpload) {
                UIAdapter.adaptFileUpload(components.fileUpload);
            }
            
            if (components.statusMonitor) {
                UIAdapter.adaptStatusMonitor(components.statusMonitor);
            }
            
            if (components.logViewer) {
                UIAdapter.adaptLogViewer(components.logViewer);
            }
            
        } catch (error) {
            console.error('Error initializing UI adaptations:', error);
        }
    }
}

// Export for ES modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { UIAdapter };
}
