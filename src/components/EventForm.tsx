import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Camera, Upload, Send, Save } from 'lucide-react';
import { toast } from 'sonner';
import CameraCapture from './CameraCapture';
import type { Label } from '../labels/label-manager';
import { createEventPackage } from '../utils/event-packer';
import { exportEventPackageAsZip } from '../utils/zip-exporter';
import type { KeyPair } from '../hooks/useKeyInitialization';

interface EventFormProps {
  labels: Label[];
  keyPair: KeyPair;
}

type FormData = Record<string, string | number | boolean | null | undefined>;

const EventForm: React.FC<EventFormProps> = ({ labels, keyPair }) => {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState<FormData>({});
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, type } = e.target;
    const target = e.target as HTMLInputElement;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? target.checked : target.value
    }));

    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      setMediaFile(e.target.files[0]);
      setErrors(prev => ({ ...prev, media: '' }));
    }
  };

  const toggleCamera = () => setCameraActive(prev => !prev);

  const handleImageCapture = (imageFile: File) => {
    setMediaFile(imageFile);
    setCameraActive(false);
    setErrors(prev => ({ ...prev, media: '' }));
  };

  const handleCameraError = (error: Error) => {
    console.error('Camera error:', error);
    setCameraActive(false);
    toast.error(t('cameraError'));
  };

  const renderMediaSection = () => {
    if (cameraActive) {
      return (
        <div className="w-full">
          <CameraCapture 
            onCapture={handleImageCapture} 
            onError={handleCameraError}
            disabled={isSubmitting}
            className="w-full"
          />
        </div>
      );
    }

    if (mediaFile) {
      return (
        <div className="relative">
          <img 
            src={URL.createObjectURL(mediaFile)} 
            alt="Preview" 
            className="max-h-64 mx-auto mb-4 rounded"
          />
          <button
            type="button"
            onClick={() => setMediaFile(null)}
            className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
          >
            &times;
          </button>
        </div>
      );
    }

    return (
      <div>
        <div className="flex justify-center space-x-4 mb-4">
          <label className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            <Upload className="inline mr-2" size={16} />
            {t('uploadMedia')}
            <input
              type="file"
              accept="image/*,video/*"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>
          <button
            type="button"
            onClick={toggleCamera}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center"
          >
            <Camera className="mr-2" size={16} />
            {t('takePhoto')}
          </button>
        </div>
        <p className="text-sm text-gray-500">
          {t('orDragAndDrop')}
        </p>
      </div>
    );
  };

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    if (!mediaFile) {
      newErrors.media = t('mediaRequired');
    }

    // Validate priority (required field)
    if (!formData.priority) {
      newErrors.priority = t('priorityRequired');
    }

    // Validate dynamic fields from labels (excluding date and media)
    labels.forEach(label => {
      if (label.type === 'media' || label.type === 'date') return;
      
      const labelName = i18n.language === 'fr' ? label.name_fr : label.name_en;
      const value = formData[label.labelId];

      if (label.required && (value === null || value === undefined || value === '')) {
        newErrors[label.labelId] = t('labelRequired', { labelName });
        return;
      }

      if (label.type === 'text' && label.constraints?.maxLength) {
        if (typeof value === 'string' && value.length > label.constraints.maxLength) {
          newErrors[label.labelId] = t('labelMaxLengthExceeded', { 
            labelName, 
            maxLength: label.constraints.maxLength 
          });
        }
        return;
      }
      
      if (label.type === 'number' && label.constraints) {
        const numValue = Number(value);
        if (!isNaN(numValue)) {
          if (label.constraints.min !== undefined && numValue < label.constraints.min) {
            newErrors[label.labelId] = t('numberTooSmall', { 
              labelName, 
              min: label.constraints.min 
            });
          }
          if (label.constraints.max !== undefined && numValue > label.constraints.max) {
            newErrors[label.labelId] = t('numberTooLarge', { 
              labelName, 
              max: label.constraints.max 
            });
          }
        }
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    
    setIsSubmitting(true);
    try {
      if (!mediaFile) throw new Error(t('mediaRequired'));
      
      // Set current date/time when form is submitted
      const formDataWithDate = {
        ...formData,
        eventDate: new Date().toISOString()
      };
      
      const fullPackage = createEventPackage(formDataWithDate, labels, mediaFile);
      const success = await sendEventToRelay(fullPackage, keyPair);

      if (success) {
        toast.success(t('eventSentSuccessfully'), { position: 'top-center' });
        setFormData({});
        setMediaFile(null);
      } else {
        throw new Error(t('failedToSendEvent'));
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error(error instanceof Error ? error.message : t('submissionError'), {
        position: 'top-center'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!validate()) return;
    
    try {
      if (!mediaFile) throw new Error(t('mediaRequired'));
      
      const fullPackage = createEventPackage(formData, labels, mediaFile);
      await exportEventPackageAsZip(fullPackage);
      toast.success(t('draftSavedSuccessfully'), { position: 'top-center' });
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error(error instanceof Error ? error.message : t('draftSaveError'), {
        position: 'top-center'
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-4 max-w-2xl mx-auto">
      <div className="space-y-4">
        {/* Description Field */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('description')}
          </label>
          <textarea
            name="description"
            value={(formData.description as string) || ''}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[100px]"
            placeholder={t('enterDescription')}
          />
        </div>

        {/* Priority Field */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('priority')} <span className="text-red-500">*</span>
          </label>
          <select
            name="priority"
            value={(formData.priority as string) || ''}
            onChange={handleChange}
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          >
            <option value="">{t('selectPriority')}</option>
            <option value="low">{t('priorityLow')}</option>
            <option value="medium">{t('priorityMedium')}</option>
            <option value="high">{t('priorityHigh')}</option>
          </select>
          {errors.priority && <p className="mt-1 text-sm text-red-600">{errors.priority}</p>}
        </div>

        {/* Dynamic Fields from Labels (excluding date and media) */}
        {labels
          .filter((label): label is Label => 
            label.type !== 'media' && label.type !== 'date'
          )
          .map(label => {
            const labelName = i18n.language === 'fr' ? label.name_fr : label.name_en;
            const error = errors[label.labelId];
            
            const renderField = () => {
              // For enum type, render a select element
              if (label.type === 'enum') {
                return (
                  <select
                    name={label.labelId}
                    value={(formData[label.labelId] as string) || ''}
                    onChange={handleChange}
                    className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required={label.required}
                  >
                    <option value="">{t('selectOption')}</option>
                    {label.options?.map((option: string) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                );
              }
              
              // For boolean type, render a checkbox
              if (label.type === 'boolean') {
                return (
                  <input
                    type="checkbox"
                    name={label.labelId}
                    checked={!!formData[label.labelId]}
                    onChange={handleChange}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    required={label.required}
                  />
                );
              }
              
              // For text and number types, render appropriate input
              return (
                <input
                  type={label.type}
                  name={label.labelId}
                  value={(formData[label.labelId] as string) || ''}
                  onChange={handleChange}
                  className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required={label.required}
                  min={label.type === 'number' ? label.constraints?.min : undefined}
                  max={label.type === 'number' ? label.constraints?.max : undefined}
                  maxLength={label.type === 'text' ? label.constraints?.maxLength : undefined}
                />
              );
            };
            
            return (
              <div key={label.labelId} className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {labelName}
                  {label.required && <span className="text-red-500">*</span>}
                </label>
                {renderField()}
                {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
              </div>
            );
          })}
      </div>

      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
        {renderMediaSection()}
        {errors.media && (
          <p className="mt-2 text-sm text-red-600">{errors.media}</p>
        )}
      </div>

      <div className="mt-6 flex justify-between">
        <button
          type="button"
          onClick={handleSaveDraft}
          disabled={isSubmitting}
          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <Save className="inline mr-2" size={16} />
          {t('saveDraft')}
        </button>
        
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
        >
          <Send className="inline mr-2" size={16} />
          {isSubmitting ? t('submitting') : t('submit')}
        </button>
      </div>
    </form>
  );
};

export default EventForm;