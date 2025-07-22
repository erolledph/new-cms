// File Manager component
import { authManager } from '../auth/AuthManager.js';
import { storage, db } from '../firebase.js';
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { collection, addDoc, serverTimestamp, getDocs, deleteDoc, doc, query, orderBy } from 'firebase/firestore';
import { fromBlob } from 'image-resize-compress';
import { toast } from '../utils/toast.js';

export class FileManager {
  constructor() {
    this.element = null;
    this.currentUser = null;
    this.selectedFiles = [];
    this.isDragOver = false;
    this.processedFiles = new Map(); // Store processed versions of files
    this.existingFiles = [];
    this.storageUsed = 0;
    this.storageLimit = 100 * 1024 * 1024; // 100MB limit
  }

  render() {
    this.currentUser = authManager.getCurrentUser();
    
    this.element = document.createElement('div');
    this.element.className = 'file-manager-container';
    this.element.innerHTML = `
      <div class="content-section">
        <h2>File Manager</h2>
        <p class="section-description">
          Upload and manage your files. Supported formats: images (JPG, PNG, GIF, WebP), documents (PDF, DOC, DOCX, TXT).
        </p>
        
        <div class="upload-section">
          <div class="upload-area" id="upload-area">
            <div class="upload-content">
              <div class="upload-icon">UPLOAD</div>
              <h3>Drop files here or click to browse</h3>
              <p>Maximum file size: 5MB for images, 10MB for documents</p>
              <input 
                type="file" 
                id="file-input" 
                multiple 
                accept="image/*,.pdf,.doc,.docx,.txt"
                style="display: none;"
              >
              <button type="button" class="browse-button" id="browse-button">
                Browse Files
              </button>
            </div>
          </div>
          
          <div class="upload-controls" id="upload-controls" style="display: none;">
            <div class="filename-control">
              <label for="custom-filename">Custom Filename (optional):</label>
              <input 
                type="text" 
                id="custom-filename" 
                placeholder="Enter custom filename (without extension)"
                maxlength="100"
              >
              <small class="field-help">Leave empty to use original filename</small>
            </div>
            
            <div class="upload-actions">
              <button type="button" class="cancel-upload-button" id="cancel-upload">
                Cancel
              </button>
              <button type="button" class="upload-button" id="upload-files">
                <span class="button-text">Upload Files</span>
                <span class="button-loading" style="display: none;">Uploading...</span>
              </button>
            </div>
          </div>
        </div>
        
        <div class="file-preview-section" id="file-preview-section" style="display: none;">
          <h3>Selected Files</h3>
          <div class="file-preview-list" id="file-preview-list">
            <!-- File previews will be added here -->
          </div>
          
          <div class="image-processing-section" id="image-processing-section" style="display: none;">
            <h4>Image Processing Settings</h4>
            <p class="section-description">Optimize your images before upload to reduce file size and improve performance.</p>
            
            <div class="processing-controls">
              <div class="control-group">
                <label for="image-quality">Quality (1-100):</label>
                <input type="range" id="image-quality" min="1" max="100" value="70" class="quality-slider">
                <span class="quality-value">70%</span>
                <small class="field-help">Lower values = smaller file size, higher values = better quality</small>
              </div>
              
              <div class="control-row">
                <div class="control-group">
                  <label for="target-width">Target Width (px):</label>
                  <input type="number" id="target-width" min="1" max="4000" placeholder="Auto" class="dimension-input">
                  <small class="field-help">Leave empty for original width</small>
                </div>
                
                <div class="control-group">
                  <label for="target-height">Target Height (px):</label>
                  <input type="number" id="target-height" min="1" max="4000" placeholder="Auto" class="dimension-input">
                  <small class="field-help">Leave empty for original height</small>
                </div>
              </div>
              
              <div class="control-group">
                <label for="output-format">Output Format:</label>
                <select id="output-format" class="format-select">
                  <option value="original">Keep Original</option>
                  <option value="jpeg" selected>JPEG (Recommended)</option>
                  <option value="png">PNG</option>
                  <option value="webp">WebP</option>
                </select>
                <small class="field-help">JPEG provides best compression for photos</small>
              </div>
              
              <div class="processing-actions">
                <button type="button" class="process-button" id="process-images">
                  <span class="button-text">Process Images</span>
                  <span class="button-loading" style="display: none;">Processing...</span>
                </button>
                <button type="button" class="reset-button" id="reset-processing">
                  Reset to Original
                </button>
              </div>
            </div>
            
            <div class="processing-warning" id="processing-warning" style="display: none;">
              <div class="warning-content">
                <span class="warning-icon">WARNING</span>
                <span class="warning-text">
                  Warning: Some processed files are larger than originals. This can happen when:
                  <br>• Converting to less efficient formats (PNG vs JPEG)
                  <br>• Using very high quality settings (90%+)
                  <br>• Processing already optimized images
                  <br>Try lowering quality or switching to JPEG format.
                </span>
              </div>
            </div>
            
            <div class="processing-results" id="processing-results" style="display: none;">
              <h5>Processing Results</h5>
              <div class="results-grid" id="results-grid">
                <!-- Processing results will be displayed here -->
              </div>
            </div>
          </div>
        </div>
        
        <div class="storage-info">
          <div class="storage-card">
            <h4>Storage Usage</h4>
            <div class="storage-stats">
              <div class="storage-bar">
                <div class="storage-used" style="width: 0%"></div>
              </div>
              <div class="storage-text">
                <span class="used">0 MB</span> of <span class="total">100 MB</span> used
              </div>
            </div>
          </div>
        </div>
        
        <div class="existing-files-section">
          <h3>Your Files</h3>
          <div class="files-controls" style="margin-bottom: 1rem;">
            <div class="search-box" style="max-width: 300px;">
              <input 
                type="text" 
                id="files-search" 
                placeholder="Search files..."
                class="search-input"
                style="border-radius: 4px; border-right: 1px solid #ddd;"
              >
            </div>
          </div>
          <div class="files-grid" id="files-grid">
            <div class="loading-files-state">
              <p>Loading your files...</p>
            </div>
          </div>
        </div>
        
        <div id="file-manager-message" class="message" style="display: none;"></div>
      </div>
    `;

    this.attachEventListeners();
    this.loadExistingFiles();
    return this.element;
  }

  attachEventListeners() {
    const uploadArea = this.element.querySelector('#upload-area');
    const fileInput = this.element.querySelector('#file-input');
    const browseButton = this.element.querySelector('#browse-button');
    const cancelUploadButton = this.element.querySelector('#cancel-upload');
    const uploadFilesButton = this.element.querySelector('#upload-files');
    const customFilenameInput = this.element.querySelector('#custom-filename');
    const qualitySlider = this.element.querySelector('#image-quality');
    const qualityValue = this.element.querySelector('.quality-value');
    const processImagesButton = this.element.querySelector('#process-images');
    const resetProcessingButton = this.element.querySelector('#reset-processing');
    const targetWidthInput = this.element.querySelector('#target-width');
    const targetHeightInput = this.element.querySelector('#target-height');
    const filesSearchInput = this.element.querySelector('#files-search');

    // Drag and drop events
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      this.handleDragOver(true);
    });

    uploadArea.addEventListener('dragleave', (e) => {
      e.preventDefault();
      // Only handle drag leave if we're leaving the upload area entirely
      if (!uploadArea.contains(e.relatedTarget)) {
        this.handleDragOver(false);
      }
    });

    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      this.handleDragOver(false);
      const files = Array.from(e.dataTransfer.files);
      this.handleFileSelection(files);
    });

    // Click to browse
    browseButton.addEventListener('click', () => {
      fileInput.click();
    });

    uploadArea.addEventListener('click', (e) => {
      // Only trigger file input if clicking on the upload area itself, not buttons
      if (e.target === uploadArea || e.target.closest('.upload-content') === uploadArea.querySelector('.upload-content')) {
        if (e.target !== browseButton) {
          fileInput.click();
        }
      }
    });

    // File input change
    fileInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files);
      this.handleFileSelection(files);
    });

    // Upload controls
    cancelUploadButton.addEventListener('click', () => {
      this.cancelUpload();
    });

    uploadFilesButton.addEventListener('click', () => {
      this.handleUpload();
    });

    // Custom filename input
    customFilenameInput.addEventListener('input', (e) => {
      this.updateFilenamePreviews(e.target.value);
    });

    // Image processing controls
    if (qualitySlider) {
      qualitySlider.addEventListener('input', (e) => {
        qualityValue.textContent = `${e.target.value}%`;
      });
    }

    if (processImagesButton) {
      processImagesButton.addEventListener('click', () => {
        this.handleImageProcessing();
      });
    }

    if (resetProcessingButton) {
      resetProcessingButton.addEventListener('click', () => {
        this.resetImageProcessing();
      });
    }

    // Auto-calculate dimensions to maintain aspect ratio
    if (targetWidthInput && targetHeightInput) {
      targetWidthInput.addEventListener('input', (e) => {
        this.calculateProportionalHeight(e.target.value);
      });

      targetHeightInput.addEventListener('input', (e) => {
        this.calculateProportionalWidth(e.target.value);
      });
    }

    // Files search
    if (filesSearchInput) {
      filesSearchInput.addEventListener('input', (e) => {
        this.filterExistingFiles(e.target.value);
      });
    }
  }

  handleDragOver(isDragOver) {
    const uploadArea = this.element.querySelector('#upload-area');
    
    if (isDragOver && !this.isDragOver) {
      this.isDragOver = true;
      uploadArea.classList.add('drag-over');
    } else if (!isDragOver && this.isDragOver) {
      this.isDragOver = false;
      uploadArea.classList.remove('drag-over');
    }
  }

  async handleFileSelection(files) {
    if (files.length === 0) return;

    // Validate files
    const validFiles = [];
    const errors = [];

    for (const file of files) {
      const validation = this.validateFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        errors.push(`${file.name}: ${validation.error}`);
      }
    }

    if (errors.length > 0) {
      toast.error(`Some files were rejected: ${errors.join(', ')}`);
    }

    if (validFiles.length === 0) {
      return;
    }

    this.selectedFiles = validFiles;
    await this.displayFilePreview();
    this.showUploadControls();
    this.showImageProcessingControls();
  }

  validateFile(file) {
    const maxImageSize = 5 * 1024 * 1024; // 5MB
    const maxDocumentSize = 10 * 1024 * 1024; // 10MB
    
    const imageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    const documentTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    
    const isImage = imageTypes.includes(file.type);
    const isDocument = documentTypes.includes(file.type);
    
    if (!isImage && !isDocument) {
      return {
        valid: false,
        error: 'Unsupported file type. Please upload images (JPG, PNG, GIF, WebP) or documents (PDF, DOC, DOCX, TXT).'
      };
    }
    
    const maxSize = isImage ? maxImageSize : maxDocumentSize;
    if (file.size > maxSize) {
      const maxSizeMB = maxSize / (1024 * 1024);
      return {
        valid: false,
        error: `File too large. Maximum size is ${maxSizeMB}MB for ${isImage ? 'images' : 'documents'}.`
      };
    }
    
    return { valid: true };
  }

  async displayFilePreview() {
    const previewSection = this.element.querySelector('#file-preview-section');
    const previewList = this.element.querySelector('#file-preview-list');
    
    previewSection.style.display = 'block';
    previewList.innerHTML = '';

    for (const file of this.selectedFiles) {
      const previewItem = await this.createFilePreviewItem(file);
      previewList.appendChild(previewItem);
    }

    // Set default dimensions for first image if available
    await this.setDefaultProcessingDimensions();
  }

  async createFilePreviewItem(file) {
    const item = document.createElement('div');
    item.className = 'file-preview-item';
    
    const isImage = file.type.startsWith('image/');
    let imageInfo = '';
    let thumbnailHtml = '';

    if (isImage) {
      try {
        const dimensions = await this.getImageDimensions(file);
        imageInfo = `
          <div class="file-dimensions">
            <span class="dimension-label">Dimensions:</span>
            <span class="dimension-value">${dimensions.width} × ${dimensions.height} pixels</span>
          </div>
        `;
        
        // Create thumbnail
        const thumbnailUrl = await this.createThumbnail(file);
        thumbnailHtml = `
          <div class="file-thumbnail">
            <img src="${thumbnailUrl}" alt="Preview" />
          </div>
        `;
      } catch (error) {
        console.error('Error getting image dimensions:', error);
        imageInfo = `
          <div class="file-dimensions">
            <span class="dimension-label">Dimensions:</span>
            <span class="dimension-value">Unable to read</span>
          </div>
        `;
      }
    } else {
      thumbnailHtml = `
        <div class="file-thumbnail document">
          <div class="document-icon">${this.getDocumentIcon(file.type)}</div>
        </div>
      `;
    }

    item.innerHTML = `
      ${thumbnailHtml}
      <div class="file-info">
        <div class="file-name">
          <span class="name-label">Original Name:</span>
          <span class="name-value">${file.name}</span>
        </div>
        <div class="file-size">
          <span class="size-label">Size:</span>
          <span class="size-value">${this.formatFileSize(file.size)}</span>
        </div>
        ${imageInfo}
        <div class="file-type">
          <span class="type-label">Type:</span>
          <span class="type-value">${file.type}</span>
        </div>
        <div class="final-filename" id="final-filename-${file.name}">
          <span class="filename-label">Upload as:</span>
          <span class="filename-value">${file.name}</span>
        </div>
      </div>
    `;

    return item;
  }

  async setDefaultProcessingDimensions() {
    const firstImage = this.selectedFiles.find(file => file.type.startsWith('image/'));
    if (firstImage) {
      try {
        const dimensions = await this.getImageDimensions(firstImage);
        const targetWidthInput = this.element.querySelector('#target-width');
        const targetHeightInput = this.element.querySelector('#target-height');
        const qualitySlider = this.element.querySelector('#image-quality');
        const qualityValue = this.element.querySelector('.quality-value');
        const outputFormatSelect = this.element.querySelector('#output-format');
        
        if (targetWidthInput && targetHeightInput) {
          // Set smart defaults based on image size
          const isLargeImage = dimensions.width > 1920 || dimensions.height > 1080;
          
          if (isLargeImage) {
            // For large images, suggest smaller dimensions
            const scaleFactor = Math.min(1920 / dimensions.width, 1080 / dimensions.height);
            const suggestedWidth = Math.round(dimensions.width * scaleFactor);
            const suggestedHeight = Math.round(dimensions.height * scaleFactor);
            
            targetWidthInput.placeholder = `${suggestedWidth} (suggested)`;
            targetHeightInput.placeholder = `${suggestedHeight} (suggested)`;
            targetWidthInput.value = suggestedWidth;
            targetHeightInput.value = suggestedHeight;
          } else {
            targetWidthInput.placeholder = `${dimensions.width} (original)`;
            targetHeightInput.placeholder = `${dimensions.height} (original)`;
          }
          
          targetWidthInput.dataset.originalWidth = dimensions.width;
          targetHeightInput.dataset.originalHeight = dimensions.height;
        }
        
        // Set better default quality for compression
        if (qualitySlider && qualityValue) {
          qualitySlider.value = 70; // More aggressive compression by default
          qualityValue.textContent = '70%';
        }
        
        // Default to JPEG for better compression
        if (outputFormatSelect) {
          outputFormatSelect.value = 'jpeg';
        }
        
      } catch (error) {
        console.error('Error setting default dimensions:', error);
      }
    }
  }

  calculateProportionalHeight(width) {
    const targetHeightInput = this.element.querySelector('#target-height');
    const originalWidth = parseInt(targetHeightInput.dataset.originalWidth);
    const originalHeight = parseInt(targetHeightInput.dataset.originalHeight);
    
    if (width && originalWidth && originalHeight) {
      const proportionalHeight = Math.round((width / originalWidth) * originalHeight);
      targetHeightInput.value = proportionalHeight;
    }
  }

  calculateProportionalWidth(height) {
    const targetWidthInput = this.element.querySelector('#target-width');
    const originalWidth = parseInt(targetWidthInput.dataset.originalWidth);
    const originalHeight = parseInt(targetWidthInput.dataset.originalHeight);
    
    if (height && originalWidth && originalHeight) {
      const proportionalWidth = Math.round((height / originalHeight) * originalWidth);
      targetWidthInput.value = proportionalWidth;
    }
  }

  async getImageDimensions(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      
      img.onload = () => {
        URL.revokeObjectURL(url);
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight
        });
      };
      
      img.onerror = () => {
        URL.revokeObjectURL(url);
        reject(new Error('Failed to load image'));
      };
      
      img.src = url;
    });
  }

  async createThumbnail(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        resolve(e.target.result);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  getDocumentIcon(mimeType) {
    switch (mimeType) {
      case 'application/pdf':
        return 'PDF';
      case 'application/msword':
      case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
        return 'DOC';
      case 'text/plain':
        return 'TXT';
      default:
        return 'FILE';
    }
  }

  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  updateFilenamePreviews(customName) {
    this.selectedFiles.forEach(file => {
      const finalFilenameElement = this.element.querySelector(`#final-filename-${file.name} .filename-value`);
      if (finalFilenameElement) {
        if (customName.trim()) {
          const extension = file.name.split('.').pop();
          const newName = `${customName.trim()}.${extension}`;
          finalFilenameElement.textContent = newName;
        } else {
          finalFilenameElement.textContent = file.name;
        }
      }
    });
  }

  showImageProcessingControls() {
    const hasImages = this.selectedFiles.some(file => file.type.startsWith('image/'));
    const processingSection = this.element.querySelector('#image-processing-section');
    
    if (hasImages && processingSection) {
      processingSection.style.display = 'block';
    }
  }

  async handleImageProcessing() {
    const processButton = this.element.querySelector('#process-images');
    const buttonText = processButton.querySelector('.button-text');
    const buttonLoading = processButton.querySelector('.button-loading');
    const resultsSection = this.element.querySelector('#processing-results');
    const resultsGrid = this.element.querySelector('#results-grid');
    const warningSection = this.element.querySelector('#processing-warning');

    // Get processing settings
    const quality = parseInt(this.element.querySelector('#image-quality').value) / 100;
    const targetWidth = parseInt(this.element.querySelector('#target-width').value) || null;
    const targetHeight = parseInt(this.element.querySelector('#target-height').value) || null;
    const outputFormat = this.element.querySelector('#output-format').value;

    // Show loading state
    processButton.disabled = true;
    buttonText.style.display = 'none';
    buttonLoading.style.display = 'inline';
    warningSection.style.display = 'none';

    try {
      const imageFiles = this.selectedFiles.filter(file => file.type.startsWith('image/'));
      const processedResults = [];
      let showWarning = false;

      for (const file of imageFiles) {
        try {
          const result = await this.processImage(file, {
            quality,
            width: targetWidth,
            height: targetHeight,
            format: outputFormat === 'original' ? null : outputFormat
          });

          processedResults.push(result);

          // Check if processed file is larger than original
          if (result.processedFile.size > file.size) {
            showWarning = true;
          }

          // Store processed file
          this.processedFiles.set(file.name, result.processedFile);

        } catch (error) {
          console.error(`Error processing ${file.name}:`, error);
          processedResults.push({
            originalFile: file,
            error: error.message
          });
        }
      }

      // Show warning if any processed file is larger
      if (showWarning) {
        warningSection.style.display = 'block';
      }

      // Display results
      this.displayProcessingResults(processedResults);
      resultsSection.style.display = 'block';

      this.showMessage('Image processing completed!', 'success');
      toast.success('Image processing completed!');

    } catch (error) {
      console.error('Error during image processing:', error);
      toast.error('Error processing images. Please try again.');
    } finally {
      // Reset button state
      processButton.disabled = false;
      buttonText.style.display = 'inline';
      buttonLoading.style.display = 'none';
    }
  }

  async processImage(file, options) {
    const { quality, width, height, format } = options;

    // Get original dimensions to prevent upscaling
    const originalDimensions = await this.getImageDimensions(file);
    
    // Prevent upscaling - cap dimensions at original size
    const maxWidth = width && width > originalDimensions.width ? originalDimensions.width : width;
    const maxHeight = height && height > originalDimensions.height ? originalDimensions.height : height;
    
    // Use more aggressive compression defaults
    const effectiveQuality = quality || 0.7; // Lower default quality for better compression
    
    // Prepare processing options
    const processOptions = {
      quality: effectiveQuality,
      type: format === 'original' ? file.type.split('/')[1] : (format || 'jpeg'), // Default to JPEG for better compression
      width: maxWidth || undefined,
      height: maxHeight || undefined
    };

    // For very large images, automatically scale down if no dimensions specified
    if (!maxWidth && !maxHeight && (originalDimensions.width > 1920 || originalDimensions.height > 1080)) {
      const scaleFactor = Math.min(1920 / originalDimensions.width, 1080 / originalDimensions.height);
      processOptions.width = Math.round(originalDimensions.width * scaleFactor);
      processOptions.height = Math.round(originalDimensions.height * scaleFactor);
    }

    // Process the image using image-resize-compress
    const processedFile = await fromBlob(file, processOptions);

    const processedDimensions = await this.getImageDimensions(processedFile);

    return {
      originalFile: file,
      processedFile,
      originalSize: file.size,
      processedSize: processedFile.size,
      originalDimensions,
      processedDimensions,
      compressionRatio: ((file.size - processedFile.size) / file.size * 100).toFixed(1),
      settings: { ...options, actualWidth: maxWidth, actualHeight: maxHeight, actualQuality: effectiveQuality }
    };
  }

  displayProcessingResults(results) {
    const resultsGrid = this.element.querySelector('#results-grid');
    
    resultsGrid.innerHTML = results.map(result => {
      if (result.error) {
        return `
          <div class="result-item error">
            <div class="result-header">
              <strong>${result.originalFile.name}</strong>
              <span class="error-badge">Error</span>
            </div>
            <div class="error-message">${result.error}</div>
          </div>
        `;
      }

      const sizeReduction = result.originalSize > result.processedSize;
      const sizeChangeClass = sizeReduction ? 'size-reduced' : 'size-increased';
      const sizeChangeIcon = sizeReduction ? '📉' : '📈';

      return `
        <div class="result-item">
          <div class="result-header">
            <strong>${result.originalFile.name}</strong>
            <span class="compression-badge ${sizeChangeClass}">
              ${sizeChangeIcon} ${sizeReduction ? '-' : '+'}${Math.abs(parseFloat(result.compressionRatio))}%
            </span>
          </div>
          <div class="result-details">
            <div class="size-comparison">
              <span class="original-size">Original: ${this.formatFileSize(result.originalSize)}</span>
              <span class="processed-size">Processed: ${this.formatFileSize(result.processedSize)}</span>
            </div>
            <div class="dimension-comparison">
              <span class="original-dimensions">
                ${result.originalDimensions.width} × ${result.originalDimensions.height}
              </span>
              <span class="arrow">→</span>
              <span class="processed-dimensions">
                ${result.processedDimensions.width} × ${result.processedDimensions.height}
              </span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  resetImageProcessing() {
    // Clear processed files
    this.processedFiles.clear();

    // Reset form controls
    const qualitySlider = this.element.querySelector('#image-quality');
    const qualityValue = this.element.querySelector('.quality-value');
    const targetWidthInput = this.element.querySelector('#target-width');
    const targetHeightInput = this.element.querySelector('#target-height');
    const outputFormatSelect = this.element.querySelector('#output-format');
    const resultsSection = this.element.querySelector('#processing-results');
    const warningSection = this.element.querySelector('#processing-warning');

    if (qualitySlider) {
      qualitySlider.value = 70;
      qualityValue.textContent = '70%';
    }

    if (targetWidthInput) targetWidthInput.value = '';
    if (targetHeightInput) targetHeightInput.value = '';
    if (outputFormatSelect) outputFormatSelect.value = 'jpeg';

    resultsSection.style.display = 'none';
    warningSection.style.display = 'none';

    // Re-apply smart defaults
    this.setDefaultProcessingDimensions();

    toast.info('Processing settings reset to defaults.');
  }

  showUploadControls() {
    const uploadControls = this.element.querySelector('#upload-controls');
    uploadControls.style.display = 'block';
    
    // Set default filename if only one file is selected
    if (this.selectedFiles.length === 1) {
      const customFilenameInput = this.element.querySelector('#custom-filename');
      const filename = this.selectedFiles[0].name;
      const nameWithoutExtension = filename.substring(0, filename.lastIndexOf('.'));
      customFilenameInput.value = nameWithoutExtension;
      customFilenameInput.placeholder = nameWithoutExtension;
    }
  }

  cancelUpload() {
    this.selectedFiles = [];
    this.processedFiles.clear();
    
    // Hide upload controls and preview
    const uploadControls = this.element.querySelector('#upload-controls');
    const previewSection = this.element.querySelector('#file-preview-section');
    const processingSection = this.element.querySelector('#image-processing-section');
    const fileInput = this.element.querySelector('#file-input');
    const customFilenameInput = this.element.querySelector('#custom-filename');
    
    uploadControls.style.display = 'none';
    previewSection.style.display = 'none';
    processingSection.style.display = 'none';
    fileInput.value = '';
    customFilenameInput.value = '';
    
    this.clearMessages();
  }

  async handleUpload() {
    if (this.selectedFiles.length === 0) {
      this.showMessage('No files selected for upload.', 'error');
      return;
    }

    const uploadButton = this.element.querySelector('#upload-files');
    const buttonText = uploadButton.querySelector('.button-text');
    const buttonLoading = uploadButton.querySelector('.button-loading');

    // Show loading state
    uploadButton.disabled = true;
    buttonText.style.display = 'none';
    buttonLoading.style.display = 'inline';

    try {
      const customFilename = this.element.querySelector('#custom-filename').value.trim();
      const uploadResults = [];
      let successCount = 0;
      let errorCount = 0;

      // Show initial progress message
      this.showMessage(`Uploading ${this.selectedFiles.length} file${this.selectedFiles.length > 1 ? 's' : ''}...`, 'info');

      // Upload each file
      for (let i = 0; i < this.selectedFiles.length; i++) {
        const originalFile = this.selectedFiles[i];
        
        try {
          // Determine which file to upload (processed or original)
          const fileToUpload = this.processedFiles.get(originalFile.name) || originalFile;
          
          // Generate filename
          const finalFilename = this.generateFinalFilename(originalFile, customFilename, i);
          
          // Update progress message
          buttonText.textContent = `Uploading ${i + 1}/${this.selectedFiles.length}...`;
          
          // Upload file to Firebase Storage
          const uploadResult = await this.uploadFileToStorage(fileToUpload, finalFilename, originalFile);
          
          // Store metadata in Firestore
          await this.storeFileMetadata(uploadResult, originalFile, fileToUpload);
          
          uploadResults.push(uploadResult);
          successCount++;
          
          console.log(`Successfully uploaded: ${finalFilename}`);
          
        } catch (error) {
          console.error(`Error uploading ${originalFile.name}:`, error);
          errorCount++;
          uploadResults.push({
            originalFile,
            error: error.message
          });
        }
      }

      // Show final results
      if (successCount > 0 && errorCount === 0) {
        toast.success(`Successfully uploaded ${successCount} file${successCount > 1 ? 's' : ''}!`);
      } else if (successCount > 0 && errorCount > 0) {
        toast.warning(`Uploaded ${successCount} file${successCount > 1 ? 's' : ''} successfully, ${errorCount} failed.`);
      } else {
        toast.error(`Failed to upload ${errorCount} file${errorCount > 1 ? 's' : ''}. Please try again.`);
      }
      
      // Reset the form after successful upload
      if (successCount > 0) {
        setTimeout(() => {
          this.cancelUpload();
          this.loadExistingFiles(); // Refresh the files list
        }, 2000);
      }

    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed. Please try again.');
    } finally {
      // Reset button state
      uploadButton.disabled = false;
      buttonText.textContent = 'Upload Files';
      buttonText.style.display = 'inline';
      buttonLoading.style.display = 'none';
    }
  }

  clearMessages() {
    const messageElement = this.element.querySelector('#file-manager-message');
    messageElement.style.display = 'none';
  }

  showMessage(message, type) {
    const messageElement = this.element.querySelector('#file-manager-message');
    messageElement.textContent = message;
    messageElement.className = `message ${type}`;
    messageElement.style.display = 'block';

    // Auto-hide success, info, and warning messages
    if (type === 'success' || type === 'info' || type === 'warning') {
      setTimeout(() => {
        messageElement.style.display = 'none';
      }, 4000);
    }
  }

  generateFinalFilename(originalFile, customFilename, index) {
    const extension = originalFile.name.split('.').pop();
    
    if (customFilename) {
      // If custom filename provided and multiple files, append index
      if (this.selectedFiles.length > 1) {
        return `${customFilename}_${index + 1}.${extension}`;
      } else {
        return `${customFilename}.${extension}`;
      }
    } else {
      // Use original filename with timestamp to ensure uniqueness
      const nameWithoutExt = originalFile.name.substring(0, originalFile.name.lastIndexOf('.'));
      const timestamp = Date.now();
      return `${nameWithoutExt}_${timestamp}.${extension}`;
    }
  }

  async uploadFileToStorage(file, filename, originalFile) {
    return new Promise((resolve, reject) => {
      // Create storage reference
      const storageRef = ref(storage, `${this.currentUser.uid}/files/${filename}`);
      
      // Create upload task
      const uploadTask = uploadBytesResumable(storageRef, file);
      
      // Monitor upload progress
      uploadTask.on('state_changed',
        (snapshot) => {
          // Progress monitoring
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log(`Upload progress for ${filename}: ${progress.toFixed(1)}%`);
          
          // Update UI with progress (optional enhancement)
          // You could add a progress bar here in the future
        },
        (error) => {
          // Handle upload errors
          console.error('Upload error:', error);
          let errorMessage = 'Upload failed';
          
          switch (error.code) {
            case 'storage/unauthorized':
              errorMessage = 'Permission denied. Please check your account permissions.';
              break;
            case 'storage/canceled':
              errorMessage = 'Upload was canceled.';
              break;
            case 'storage/quota-exceeded':
              errorMessage = 'Storage quota exceeded. Please free up space.';
              break;
            case 'storage/invalid-format':
              errorMessage = 'Invalid file format.';
              break;
            case 'storage/retry-limit-exceeded':
              errorMessage = 'Upload failed after multiple retries. Please try again.';
              break;
            default:
              errorMessage = `Upload failed: ${error.message}`;
          }
          
          reject(new Error(errorMessage));
        },
        async () => {
          // Upload completed successfully
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            resolve({
              filename,
              downloadURL,
              storagePath: uploadTask.snapshot.ref.fullPath,
              size: file.size,
              type: file.type,
              uploadedAt: new Date()
            });
          } catch (error) {
            reject(new Error(`Failed to get download URL: ${error.message}`));
          }
        }
      );
    });
  }

  async storeFileMetadata(uploadResult, originalFile, uploadedFile) {
    try {
      // Get image dimensions if it's an image
      let dimensions = null;
      if (originalFile.type.startsWith('image/')) {
        try {
          dimensions = await this.getImageDimensions(originalFile);
        } catch (error) {
          console.warn('Could not get image dimensions:', error);
        }
      }

      // Prepare metadata
      const metadata = {
        // File information
        originalName: originalFile.name,
        filename: uploadResult.filename,
        size: uploadedFile.size,
        originalSize: originalFile.size,
        type: originalFile.type,
        
        // Storage information
        downloadURL: uploadResult.downloadURL,
        storagePath: uploadResult.storagePath,
        
        // Image-specific information
        dimensions: dimensions ? {
          width: dimensions.width,
          height: dimensions.height
        } : null,
        
        // Processing information
        wasProcessed: this.processedFiles.has(originalFile.name),
        compressionRatio: this.processedFiles.has(originalFile.name) ? 
          ((originalFile.size - uploadedFile.size) / originalFile.size * 100).toFixed(1) : null,
        
        // Timestamps
        uploadedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
        
        // User information
        userId: this.currentUser.uid,
        userEmail: this.currentUser.email
      };

      // Store in Firestore
      const filesCollectionRef = collection(db, 'users', this.currentUser.uid, 'files');
      const docRef = await addDoc(filesCollectionRef, metadata);
      
      console.log('File metadata stored with ID:', docRef.id);
      
      return docRef.id;
      
    } catch (error) {
      console.error('Error storing file metadata:', error);
      // Don't throw error here as the file was uploaded successfully
      // Just log the error and continue
    }
  }

  async loadExistingFiles() {
    if (!this.currentUser) {
      console.error('No current user found');
      return;
    }

    try {
      const filesCollectionRef = collection(db, 'users', this.currentUser.uid, 'files');
      const filesQuery = query(filesCollectionRef, orderBy('uploadedAt', 'desc'));
      const filesSnapshot = await getDocs(filesQuery);
      
      this.existingFiles = filesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calculate storage usage
      this.storageUsed = this.existingFiles.reduce((total, file) => total + (file.size || 0), 0);
      
      this.renderExistingFiles();
      this.updateStorageInfo();
      
    } catch (error) {
      console.error('Error loading existing files:', error);
      this.renderExistingFilesError();
    }
  }

  renderExistingFiles() {
    const filesGrid = this.element.querySelector('#files-grid');
    
    if (this.existingFiles.length === 0) {
      filesGrid.innerHTML = `
        <div class="empty-files-state">
          <p>No files uploaded yet. Upload your first file to get started!</p>
        </div>
      `;
      return;
    }

    const filesHTML = this.existingFiles.map(file => this.renderFileItem(file)).join('');
    filesGrid.innerHTML = filesHTML;
    
    this.attachFileItemListeners();
  }

  renderFileItem(file) {
    const isImage = file.type && file.type.startsWith('image/');
    const uploadDate = this.formatFileDate(file.uploadedAt);
    const fileSize = this.formatFileSize(file.size || 0);
    
    let thumbnailHTML = '';
    if (isImage) {
      thumbnailHTML = `
        <div class="file-item-thumbnail">
          <img src="${file.downloadURL}" alt="${file.filename}" loading="lazy" />
        </div>
      `;
    } else {
      const icon = this.getDocumentIcon(file.type);
      thumbnailHTML = `
        <div class="file-item-thumbnail document">
          <div class="document-icon">${icon}</div>
        </div>
      `;
    }

    const dimensionsHTML = file.dimensions ? 
      `<div class="file-item-dimensions">${file.dimensions.width} × ${file.dimensions.height}</div>` : '';

    const compressionHTML = file.wasProcessed && file.compressionRatio ? 
      `<div class="file-item-compression">Compressed ${file.compressionRatio}%</div>` : '';

    return `
      <div class="file-item" data-file-id="${file.id}">
        ${thumbnailHTML}
        <div class="file-item-info">
          <div class="file-item-name" title="${file.filename}">${file.filename}</div>
          <div class="file-item-size">${fileSize}</div>
          ${dimensionsHTML}
          ${compressionHTML}
          <div class="file-item-date">${uploadDate}</div>
        </div>
        <div class="file-item-actions">
          <button class="file-action-button copy-url-button" data-file-id="${file.id}" title="Copy URL">
            📋
          </button>
          <button class="file-action-button select-file-button" data-file-id="${file.id}" title="Select File">
            ✅
          </button>
          <button class="file-action-button delete-file-button" data-file-id="${file.id}" title="Delete">
            🗑️
          </button>
        </div>
      </div>
    `;
  }

  attachFileItemListeners() {
    const copyUrlButtons = this.element.querySelectorAll('.copy-url-button');
    const selectFileButtons = this.element.querySelectorAll('.select-file-button');
    const deleteFileButtons = this.element.querySelectorAll('.delete-file-button');

    copyUrlButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const fileId = e.target.dataset.fileId;
        this.handleCopyFileUrl(fileId);
      });
    });

    selectFileButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const fileId = e.target.dataset.fileId;
        this.handleSelectFile(fileId);
      });
    });

    deleteFileButtons.forEach(button => {
      button.addEventListener('click', (e) => {
        const fileId = e.target.dataset.fileId;
        this.handleDeleteFile(fileId);
      });
    });
  }

  async handleCopyFileUrl(fileId) {
    const file = this.existingFiles.find(f => f.id === fileId);
    if (!file) return;

    try {
      await navigator.clipboard.writeText(file.downloadURL);
      toast.success('File URL copied to clipboard!');
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = file.downloadURL;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      toast.success('File URL copied to clipboard!');
    }
  }

  handleSelectFile(fileId) {
    const file = this.existingFiles.find(f => f.id === fileId);
    if (!file) return;

    // Dispatch custom event with file information
    window.dispatchEvent(new CustomEvent('file-selected', {
      detail: {
        fileId: file.id,
        filename: file.filename,
        downloadURL: file.downloadURL,
        type: file.type,
        size: file.size,
        dimensions: file.dimensions
      }
    }));

    toast.success(`Selected: ${file.filename}`);
  }

  async handleDeleteFile(fileId) {
    const file = this.existingFiles.find(f => f.id === fileId);
    if (!file) return;

    const confirmed = confirm(`Are you sure you want to delete "${file.filename}"?\n\nThis action cannot be undone.`);
    if (!confirmed) return;

    try {
      // Delete from Firebase Storage
      const storageRef = ref(storage, file.storagePath);
      await deleteObject(storageRef);

      // Delete metadata from Firestore
      const fileDocRef = doc(db, 'users', this.currentUser.uid, 'files', fileId);
      await deleteDoc(fileDocRef);

      // Remove from local array
      this.existingFiles = this.existingFiles.filter(f => f.id !== fileId);
      
      // Update storage usage
      this.storageUsed -= (file.size || 0);
      
      // Re-render files and update storage info
      this.renderExistingFiles();
      this.updateStorageInfo();

      toast.success('File deleted successfully!');

    } catch (error) {
      console.error('Error deleting file:', error);
      let errorMessage = 'Error deleting file. Please try again.';
      
      if (error.code === 'storage/object-not-found') {
        errorMessage = 'File not found in storage. Removing from list.';
        // Still remove from Firestore and local array
        try {
          const fileDocRef = doc(db, 'users', this.currentUser.uid, 'files', fileId);
          await deleteDoc(fileDocRef);
          this.existingFiles = this.existingFiles.filter(f => f.id !== fileId);
          this.renderExistingFiles();
        } catch (firestoreError) {
          console.error('Error removing file metadata:', firestoreError);
        }
      }
      
      toast.error(errorMessage);
    }
  }

  filterExistingFiles(searchTerm) {
    const filesGrid = this.element.querySelector('#files-grid');
    const fileItems = filesGrid.querySelectorAll('.file-item');
    
    const term = searchTerm.toLowerCase();
    
    fileItems.forEach(item => {
      const filename = item.querySelector('.file-item-name').textContent.toLowerCase();
      const shouldShow = !term || filename.includes(term);
      item.style.display = shouldShow ? 'block' : 'none';
    });
  }

  updateStorageInfo() {
    const storageUsedElement = this.element.querySelector('.storage-used');
    const storageTextElement = this.element.querySelector('.storage-text');
    
    if (storageUsedElement && storageTextElement) {
      const usedPercentage = (this.storageUsed / this.storageLimit) * 100;
      const usedMB = (this.storageUsed / (1024 * 1024)).toFixed(1);
      const totalMB = (this.storageLimit / (1024 * 1024)).toFixed(0);
      
      storageUsedElement.style.width = `${Math.min(usedPercentage, 100)}%`;
      
      // Change color based on usage
      if (usedPercentage > 90) {
        storageUsedElement.style.backgroundColor = '#dc3545';
      } else if (usedPercentage > 75) {
        storageUsedElement.style.backgroundColor = '#ffc107';
      } else {
        storageUsedElement.style.backgroundColor = '#007bff';
      }
      
      storageTextElement.innerHTML = `
        <span class="used">${usedMB} MB</span> of <span class="total">${totalMB} MB</span> used
      `;
    }
  }

  renderExistingFilesError() {
    const filesGrid = this.element.querySelector('#files-grid');
    filesGrid.innerHTML = `
      <div class="error-files-state">
        <p style="color: #dc3545;">Error loading files. Please refresh the page.</p>
        <button class="action-button" onclick="window.location.reload()">
          Refresh Page
        </button>
      </div>
    `;
  }

  formatFileDate(timestamp) {
    if (!timestamp) return 'Unknown';
    
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Unknown';
    }
  }
}