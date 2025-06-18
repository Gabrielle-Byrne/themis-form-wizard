"use client"
import React, { useState, useEffect } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { 
  Trash2, 
  Plus, 
  GripVertical, 
  ChevronDown, 
  ChevronUp, 
  ChevronRight,
  EyeIcon, 
  Settings, 
  Save,
  User,
  Shield,
  Phone,
  Mail,
  DollarSign,
  Scale,
  FileText,
  BriefcaseIcon,
  AlertCircle,
  // Add authentication-related icons
  Lock,
  Eye,
  EyeOff,
  Key,
  RefreshCcw
} from 'lucide-react';
import { saveFormData, getFormData } from './formHelper';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';

// Icon mapping for form steps
const ICONS = {
  User,
  Shield,
  Phone,
  Mail,
  DollarSign,
  Scale,
  FileText,
  BriefcaseIcon
};

// SortableField component
const SortableField = ({ field, fieldId, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: fieldId,
    data: {
      type: 'field',
      field
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div
        className={`bg-gray-50 rounded-lg p-4 border ${
          isDragging ? 'border-blue-500 shadow-lg' : 'border-gray-200'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-move w-full" {...listeners}>
            <GripVertical className="text-gray-400" size={16} />
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// SortableStep component
const SortableStep = ({ step, stepIndex, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: step.id,
    data: {
      type: 'step',
      stepIndex,
      step
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className={`mb-4 ${isDragging ? 'border-2 border-blue-500' : ''}`}>
        <CardContent className="p-6">
          <div className="cursor-move" {...listeners}>
            {children}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Form Preview Component
const FormPreview = ({ formData }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formValues, setFormValues] = useState({});
  const [errors, setErrors] = useState({});
  const [activeResources, setActiveResources] = useState([]);
  const [showEmergencyAlert, setShowEmergencyAlert] = useState(false);

  if (!formData?.steps?.length) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            No form steps have been created yet. Add some steps in the editor to get started.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  const handleInputChange = (name, value, field) => {
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));

    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }

    // Handle conditional triggering
    if (field.type === 'radio' || field.type === 'select') {
      const affectedFields = formData.steps.flatMap(step =>
        step.fields.filter(f => f.conditional?.field === name)
      );

      if (affectedFields.length > 0) {
        const newValues = { ...formValues, [name]: value };
        setFormValues(newValues);
      }
    }

    // Handle validation
    if (field.validation?.rules) {
      validateField(field, value);
    }
  };

  const validateField = (field, value) => {
    const newErrors = { ...errors };
    
    if (field.required && !value) {
      newErrors[field.name] = `${field.label} is required`;
    } else if (field.validation?.rules) {
      field.validation.rules.forEach(rule => {
        switch (rule) {
          case 'email':
            if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
              newErrors[field.name] = 'Please enter a valid email address';
            }
            break;
          case 'phoneNumber':
            if (value && !/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(value)) {
              newErrors[field.name] = 'Please enter a valid phone number (XXX) XXX-XXXX';
            }
            break;
          case 'postalCode':
            if (value && !/^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/.test(value)) {
              newErrors[field.name] = 'Please enter a valid postal code A1A 1A1';
            }
            break;
        }
      });
    }

    setErrors(newErrors);
  };

  const validateStep = () => {
    const currentFields = formData.steps[activeStep].fields;
    const newErrors = {};
    let isValid = true;

    currentFields.forEach(field => {
      if (field.required && !formValues[field.name]) {
        newErrors[field.name] = `${field.label} is required`;
        isValid = false;
      }
      if (field.validation?.rules) {
        validateField(field, formValues[field.name]);
        if (errors[field.name]) {
          isValid = false;
        }
      }
    });

    setErrors(prev => ({ ...prev, ...newErrors }));
    return isValid;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateStep()) {
      // console.log('Form submitted:', formValues);
      // Handle form submission
    }
  };

  return (
    <div className="max-w-7xl mx-auto flex gap-6">
      <div className="flex-1">
        <Card className="shadow-sm">
          {/* Form Header */}
          <CardHeader className="border-b bg-white">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{formData.metadata.clinic.name}</CardTitle>
                {formData.metadata.clinic.phone && (
                  <p className="text-sm text-gray-500 mt-1">
                    Contact: {formData.metadata.clinic.phone}
                    {formData.metadata.clinic.email && ` | ${formData.metadata.clinic.email}`}
                  </p>
                )}
              </div>
              <div className="text-sm text-gray-500">
                Step {activeStep + 1} of {formData.steps.length}
              </div>
            </div>
          </CardHeader>

          {/* Progress Steps */}
          <div className="border-b bg-gray-50">
            <div className="px-6 py-4">
              <div className="flex flex-wrap items-center gap-2">
                {formData.steps.map((step, index) => {
                  const Icon = ICONS[step.icon] || User;
                  const isActive = activeStep === index;
                  const isPast = activeStep > index;
                  const isFuture = activeStep < index;

                  return (
                    <div key={step.id} className="flex items-center">
                      <button
                        onClick={() => validateStep() && setActiveStep(index)}
                        disabled={isFuture}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm whitespace-nowrap transition-colors ${
                          isActive 
                            ? 'bg-blue-500 text-white shadow-sm' 
                            : isPast
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-500'
                        } ${isFuture ? 'opacity-50 cursor-not-allowed' : 'hover:bg-opacity-90'}`}
                      >
                        <Icon size={14} />
                        <span className="font-medium">{step.title}</span>
                      </button>
                      {index < formData.steps.length - 1 && (
                        <ChevronRight className="mx-1 text-gray-400" size={16} />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <CardContent className="p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {formData.steps[activeStep].fields.map((field, index) => {
                // Check conditional display
                const shouldShow = !field.conditional || 
                  (field.conditional && formValues[field.conditional.field] === field.conditional.value);

                if (!shouldShow) return null;

                const baseFieldProps = {
                  id: field.name,
                  name: field.name,
                  required: field.required,
                  onChange: (e) => handleInputChange(
                    field.name, 
                    e.target.type === 'checkbox' ? e.target.checked : e.target.value,
                    field
                  ),
                  value: formValues[field.name] || '',
                  className: `w-full px-3 py-2 border ${
                    errors[field.name] 
                      ? 'border-red-300 bg-red-50' 
                      : 'border-gray-300'
                  } rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500`
                };

                return (
                  <div key={index} className="space-y-2">
                    <label htmlFor={field.name} className="block font-medium text-gray-700">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    
                    {field.hint && (
                      <p className="text-sm text-gray-500">{field.hint}</p>
                    )}

                    {field.type === 'text' && (
                      <div className="relative">
                        <input 
                          type="text" 
                          {...baseFieldProps}
                          placeholder={field.placeholder}
                        />
                      </div>
                    )}

                    {field.type === 'textarea' && (
                      <textarea {...baseFieldProps} rows={4} />
                    )}

                    {field.type === 'number' && (
                      <div className="relative">
                        {field.name.toLowerCase().includes('income') || 
                         field.name.toLowerCase().includes('expense') || 
                         field.name.toLowerCase().includes('assets') ? (
                          <>
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                            <input 
                              type="number" 
                              {...baseFieldProps} 
                              className={`${baseFieldProps.className} pl-8`}
                              min="0"
                              step="0.01"
                            />
                          </>
                        ) : (
                          <input type="number" {...baseFieldProps} />
                        )}
                      </div>
                    )}

                    {field.type === 'email' && (
                      <input 
                        type="email" 
                        {...baseFieldProps} 
                        placeholder="email@example.com" 
                      />
                    )}

                    {field.type === 'tel' && (
                      <div>
                        <input 
                          type="tel" 
                          {...baseFieldProps} 
                          placeholder="(123) 456-7890" 
                        />
                        <p className="mt-1 text-xs text-gray-500">Format: (XXX) XXX-XXXX</p>
                      </div>
                    )}

                    {field.type === 'date' && (
                      <input type="date" {...baseFieldProps} />
                    )}

                    {field.type === 'checkbox' && (
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          {...baseFieldProps}
                          checked={formValues[field.name] || false}
                          className="h-4 w-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500"
                        />
                        <span className="text-gray-700">{field.label}</span>
                      </div>
                    )}

                    {field.type === 'radio' && field.options && (
                      <div className="space-y-2">
                        {field.options.map((option, optIndex) => (
                          <div key={optIndex} className="flex items-center gap-2">
                            <input
                              type="radio"
                              id={`${field.name}-${optIndex}`}
                              name={field.name}
                              value={option.value}
                              checked={formValues[field.name] === option.value}
                              onChange={(e) => handleInputChange(field.name, e.target.value, field)}
                              className="h-4 w-4 border-gray-300 text-blue-500 focus:ring-blue-500"
                            />
                            <label htmlFor={`${field.name}-${optIndex}`} className="text-gray-700">
                              {option.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}

                    {field.type === 'select' && field.options && (
                      <select {...baseFieldProps}>
                        <option value="">{field.placeholder || `Select ${field.label}`}</option>
                        {field.options.map((option, optIndex) => (
                          <option key={optIndex} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    )}

                    {errors[field.name] && (
                      <p className="text-sm text-red-600 mt-1">{errors[field.name]}</p>
                    )}
                  </div>
                );
              })}

              {/* Navigation Buttons */}
              <div className="flex justify-between pt-6 border-t">
                {activeStep > 0 && (
                  <button
                    type="button"
                    onClick={() => setActiveStep(prev => prev - 1)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Previous
                  </button>
                )}
                {activeStep < formData.steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => validateStep() && setActiveStep(prev => prev + 1)}
                    className="ml-auto px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md shadow-sm hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                  >
                    Next
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="ml-auto px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-md shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    Submit
                  </button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Resources Sidebar */}
      {(showEmergencyAlert || activeResources.length > 0) && (
        <div className="w-80 shrink-0 space-y-4">
          {showEmergencyAlert && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                If you are in immediate danger, please call emergency services (911) immediately.
              </AlertDescription>
            </Alert>
          )}

          {activeResources.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Available Resources</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {activeResources.map((resource, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg">
                      <h3 className="font-medium">{resource.name}</h3>
                      {resource.phoneNumber && (
                        <p className="text-sm text-gray-600 mt-1">
                          Phone: {resource.phoneNumber}
                        </p>
                      )}
                      {resource.location && (
                        <p className="text-sm text-gray-600">
                        Location: {resource.location}
                      </p>
                    )}
                    {resource.website && (
                        <p className="text-sm text-gray-600 mt-1">
                          Phone: {resource.website}
                        </p>
                      )}
                    {resource.notes && (
                      <p className="text-sm text-gray-600 mt-1 italic">
                        Note: {resource.notes}
                      </p>
                    )}
                    {resource.description && (
                      <p className="text-sm text-gray-600 mt-1">
                        {resource.description}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    )}
  </div>
);
};

// Main Form Editor Component
const FormEditor = () => {
  const initialFormState = {
    metadata: {
      version: "1.0.0",
      clinic: {
        name: "Legal Clinic Intake Form",
        phone: "",
        email: ""
      }
    },
    steps: [
      {
        id: "step_1",
        title: "Basic Information",
        icon: "User",
        fields: []
      }
    ]
  };

  // Form editor state
  const [formData, setFormData] = useState(initialFormState);
  const [activeStep, setActiveStep] = useState(0);
  const [expandedField, setExpandedField] = useState(null);
  const [activeTab, setActiveTab] = useState('editor');
  const [saveStatus, setSaveStatus] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [activeField, setActiveField] = useState(null);
  const [draggedItemType, setDraggedItemType] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const resetIntakeSimple = async () => {
    if (window.confirm('Are you sure you want to reset the intake form to the original configuration? All changes will be lost.')) {
      try {
        setSaveStatus('Resetting...');
        
        // Load the original JSON file
        const intakeJson = await import('../lib/intake.json');
        
        // Reset only the form data
        setFormData(intakeJson.default);
        
        setSaveStatus('Reset complete!');
        setTimeout(() => setSaveStatus(''), 3000);
      } catch (error) {
        console.error('Failed to reset intake form:', error);
        setSaveStatus('Reset failed');
        setTimeout(() => setSaveStatus(''), 3000);
      }
    }
  };
  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [secretCode, setSecretCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  
  // Authentication constants
  const CORRECT_SECRET_CODE = 'LegalAccess2025intake'; // Your secret code
  const MAX_ATTEMPTS = 5;
  const LOCK_TIME = 60; // Seconds
  const STORAGE_KEY = 'formEditorAuthenticated';

  // Configure DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Check for authentication from session storage
  useEffect(() => {
    const storedAuth = sessionStorage.getItem(STORAGE_KEY);
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  // Handle lock timer countdown
  useEffect(() => {
    let interval;
    if (isLocked && lockTimer > 0) {
      interval = setInterval(() => {
        setLockTimer(prevTime => prevTime - 1);
      }, 1000);
    } else if (lockTimer === 0 && isLocked) {
      setIsLocked(false);
    }

    return () => clearInterval(interval);
  }, [isLocked, lockTimer]);

  // Load initial data
  useEffect(() => {
    if (!isAuthenticated) return; // Only load data if authenticated
    
    const loadData = async () => {
      try {
        const { success, data, error } = await getFormData();
        if (success && data) {
          setFormData(data[data.length-1]);
        } else {
          console.error('Error loading data:', error);
          setFormData(initialFormState);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        setFormData(initialFormState);
      } finally {
        setIsInitialized(true);
      }
    };
    loadData();
  }, [isAuthenticated]);

  // Auto-save functionality
  // useEffect(() => {
  //   if (!isInitialized || !isAuthenticated) return;

  //   const autoSave = async () => {
  //     if (formData) {
  //       try {
  //         setSaveStatus('Saving...');
  //         const { success, error } = await saveFormData(formData);
          
  //         if (success) {
  //           setSaveStatus('Saved successfully!');
  //         } else {
  //           throw new Error(error);
  //         }
  //       } catch (error) {
  //         console.error('Error auto-saving form data:', error);
  //         setSaveStatus('Error saving changes');
  //       } finally {
  //         setTimeout(() => setSaveStatus(''), 3000);
  //       }
  //     }
  //   };

  //   const timeoutId = setTimeout(autoSave, 1000);
  //   return () => clearTimeout(timeoutId);
  // }, [formData, isInitialized, isAuthenticated]);

  const handleSave = async () => {
        setSaveStatus('Saving...');
        try {
          const { success } = await saveFormData(formData);
          setSaveStatus(success ? 'Saved successfully!' : 'Error saving');
        } catch (error) {
          setSaveStatus('Error saving');
          console.error('Save error:', error);
        }
        setTimeout(() => setSaveStatus(''), 3000);
      };

  // Authentication form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (isLocked) return;

    if (secretCode === CORRECT_SECRET_CODE) {
      setIsAuthenticated(true);
      setError('');
      // Store authentication state in session storage
      sessionStorage.setItem(STORAGE_KEY, 'true');
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setError('Invalid secret code. Please try again.');
      
      // Lock the form after MAX_ATTEMPTS
      if (newAttempts >= MAX_ATTEMPTS) {
        setIsLocked(true);
        setLockTimer(LOCK_TIME);
        setError(`Too many failed attempts. Access locked for ${LOCK_TIME} seconds.`);
      }
    }
  };

  // Handle logout
  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem(STORAGE_KEY);
  };

  // Handle drag start
  const handleDragStart = (event) => {
    const { active } = event;
    setDraggedItemType(active.data?.current?.type);
    setDraggedItem(active.data?.current?.field || active.data?.current?.step);
  };

  // Handle drag end
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      setDraggedItemType(null);
      setDraggedItem(null);
      return;
    }

    setFormData((formData) => {
      if (active.data.current.type === 'field') {
        // Handle field reordering
        const [sourceStepIndex, sourceFieldIndex] = active.id.split('-').map(Number);
        const [targetStepIndex, targetFieldIndex] = over.id.split('-').map(Number);
        
        const newSteps = [...formData.steps];
        const sourceStep = newSteps[sourceStepIndex];
        const targetStep = newSteps[targetStepIndex];
        
        if (sourceStepIndex === targetStepIndex) {
          // Reorder within same step
          const reorderedFields = [...sourceStep.fields];
          const [movedField] = reorderedFields.splice(sourceFieldIndex, 1);
          reorderedFields.splice(targetFieldIndex, 0, movedField);
          newSteps[sourceStepIndex] = { ...sourceStep, fields: reorderedFields };
        } else {
          // Move between steps
          const sourceFields = [...sourceStep.fields];
          const [movedField] = sourceFields.splice(sourceFieldIndex, 1);
          const targetFields = [...targetStep.fields];
          targetFields.splice(targetFieldIndex, 0, movedField);
          
          newSteps[sourceStepIndex] = { ...sourceStep, fields: sourceFields };
          newSteps[targetStepIndex] = { ...targetStep, fields: targetFields };
        }
        
        return { ...formData, steps: newSteps };
      } else {
        // Handle step reordering
        const oldIndex = formData.steps.findIndex((step) => step.id === active.id);
        const newIndex = formData.steps.findIndex((step) => step.id === over.id);
        return {
          ...formData,
          steps: arrayMove(formData.steps, oldIndex, newIndex),
        };
      }
    });

    setDraggedItemType(null);
    setDraggedItem(null);
  };

  const addStep = () => {
    setFormData(prev => ({
      ...prev,
      steps: [...prev.steps, {
        id: `step_${prev.steps.length + 1}`,
        title: "New Step",
        icon: "User",
        fields: []
      }]
    }));
  };

  const removeStep = (stepIndex) => {
    if (window.confirm('Are you sure you want to delete this step?')) {
    setFormData(prev => ({
      ...prev,
      steps: prev.steps.filter((_, index) => index !== stepIndex)
    }));
    if (activeStep >= stepIndex) {
      setActiveStep(Math.max(0, activeStep - 1));
    }
     }
  };

  const handleStepChange = (stepIndex, field, value) => {
    setFormData(prev => {
      const newSteps = [...prev.steps];
      newSteps[stepIndex] = {
        ...newSteps[stepIndex],
        [field]: value
      };
      return { ...prev, steps: newSteps };
    });
  };

  const addField = (stepIndex) => {
    setFormData(prev => {
      const newSteps = [...prev.steps];
      newSteps[stepIndex] = {
        ...newSteps[stepIndex],
        fields: [
          ...newSteps[stepIndex].fields,
          {
            type: 'text',
            name: `field_${newSteps[stepIndex].fields.length + 1}`,
            label: 'New Field',
            required: false
          }
        ]
      };
      return { ...prev, steps: newSteps };
    });
  };

  const removeField = (stepIndex, fieldIndex) => {
        if (window.confirm('Are you sure you want to delete this field?')) {
    setFormData(prev => {
      const newSteps = [...prev.steps];
      newSteps[stepIndex] = {
        ...newSteps[stepIndex],
        fields: newSteps[stepIndex].fields.filter((_, i) => i !== fieldIndex)
      };
      return { ...prev, steps: newSteps };
    });
  }
  };

  const handleFieldChange = (stepIndex, fieldIndex, field, value) => {
    setFormData(prev => {
      const newSteps = [...prev.steps];
      newSteps[stepIndex] = {
        ...newSteps[stepIndex],
        fields: newSteps[stepIndex].fields.map((f, i) => 
          i === fieldIndex ? { ...f, [field]: value } : f
        )
      };
      return { ...prev, steps: newSteps };
    });
  };

  // If not authenticated, show login screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
          <div className="text-center mb-8">
            <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
              <Shield className="h-8 w-8 text-blue-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Form Editor Access</h2>
            <p className="text-gray-600 mt-2">Please enter the secret code to access the form editor</p>
          </div>
          
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="secretCode" className="block text-sm font-medium text-gray-700 mb-2">
                Secret Code
              </label>
              <div className="relative">
                <input
                  id="secretCode"
                  name="secretCode"
                  type={showCode ? "text" : "password"}
                  value={secretCode}
                  onChange={(e) => setSecretCode(e.target.value)}
                  disabled={isLocked}
                  className="w-full pr-10 py-2 px-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter secret code"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-500"
                >
                  {showCode ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLocked}
                className={`w-full flex justify-center items-center gap-2 py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                  isLocked ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                }`}
              >
                {isLocked ? (
                  <>
                    <RefreshCcw size={16} className="animate-spin" /> 
                    Locked ({lockTimer}s)
                  </>
                ) : (
                  <>
                    <Key size={16} />
                    Access Form Editor
                  </>
                )}
              </button>
            </div>
          </form>
          
          <div className="mt-6 text-center text-xs text-gray-500">
            <p>This page contains sensitive configuration controls.</p>
            <p>Unauthorized access is prohibited.</p>
          </div>
        </div>
      </div>
    );
  }

  if (!formData) {
    return <div className="p-8 text-center">Loading form data...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8 bg-white rounded-lg shadow-sm p-4">
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('editor')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'editor' 
                  ? 'bg-blue-500 text-white shadow-sm' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Settings size={16} />
              Editor
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                activeTab === 'preview' 
                  ? 'bg-blue-500 text-white shadow-sm' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <EyeIcon size={16} />
              Preview
            </button>
            <button
            onClick={() => {
              handleSave();
            }}
            className="flex items-center gap-2 px-2 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            <Save size={14} /> Save Changes
          </button>
           {saveStatus && (
              <span className={`text-sm font-medium ${
                saveStatus.includes('Error') ? 'text-red-500' : 'text-green-500'
              }`}>
                {saveStatus}
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
          <button
              onClick={resetIntakeSimple}
              className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors"
            >
              <RefreshCcw size={14} /> Reset to Original
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 mr-4"
            >
              <Lock size={14} /> Logout
            </button>
          </div>
        </div>
      </div>
  
      {/* Main Content Area */}
      {activeTab === 'editor' ? (
        <div className="space-y-8">
          {/* Metadata Section */}
          <Card>
            <CardHeader>
              <CardTitle>Form Metadata</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Clinic Name</label>
                  <input
                    type="text"
                    value={formData.metadata.clinic.name}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      metadata: {
                        ...prev.metadata,
                        clinic: {
                          ...prev.metadata.clinic,
                          name: e.target.value
                        }
                      }
                    }))}
                    className="w-full p-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Phone</label>
                  <input
                    type="tel"
                    value={formData.metadata.clinic.phone}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      metadata: {
                        ...prev.metadata,
                        clinic: {
                          ...prev.metadata.clinic,
                          phone: e.target.value
                        }
                      }
                    }))}
                    className="w-full p-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Email</label>
                  <input
                    type="email"
                    value={formData.metadata.clinic.email}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      metadata: {
                        ...prev.metadata,
                        clinic: {
                          ...prev.metadata.clinic,
                          email: e.target.value
                        }
                      }
                    }))}
                    className="w-full p-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Version</label>
                  <input
                    type="text"
                    value={formData.metadata.version}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      metadata: {
                        ...prev.metadata,
                        version: e.target.value
                      }
                    }))}
                    className="w-full p-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
  
          {/* Steps Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Form Steps</h2>
              <button
                onClick={addStep}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg shadow-sm hover:bg-blue-600 transition-colors"
              >
                <Plus size={16} /> Add Step
              </button>
            </div>
  
            {formData.steps.map((step, stepIndex) => (
              <Card key={step.id} className="mb-4">
                <CardContent className="p-6">
                  {/* Step Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-4">
                      {ICONS[step.icon] && React.createElement(ICONS[step.icon], {
                        size: 20,
                        className: "text-blue-500"
                      })}
                      <input
                        type="text"
                        value={step.title}
                        onChange={(e) => handleStepChange(stepIndex, 'title', e.target.value)}
                        className="font-semibold p-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <select
                        value={step.icon}
                        onChange={(e) => handleStepChange(stepIndex, 'icon', e.target.value)}
                        className="p-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        {Object.keys(ICONS).map(icon => (
                          <option key={icon} value={icon}>{icon}</option>
                        ))}
                      </select>
                      <button
                        onClick={() => removeStep(stepIndex)}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
  
                  {/* Fields Section */}
                  <div className="space-y-4 pl-6 border-l-2 border-blue-100">
                    <div className="flex justify-between items-center">
                      <h3 className="text-sm font-medium text-gray-700">Fields</h3>
                      <button
                        onClick={() => addField(stepIndex)}
                        className="flex items-center gap-2 px-3 py-1 text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        <Plus size={14} /> Add Field
                      </button>
                    </div>
  
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragStart={handleDragStart}
                      onDragEnd={(event) => {
                        const { active, over } = event;
                        if (!over || active.id === over.id) return;
  
                        setFormData(prev => {
                          const newSteps = [...prev.steps];
                          const step = newSteps[stepIndex];
                          const activeIndex = parseInt(active.id);
                          const overIndex = parseInt(over.id);
                          
                          const fields = [...step.fields];
                          const [movedField] = fields.splice(activeIndex, 1);
                          fields.splice(overIndex, 0, movedField);
                          
                          newSteps[stepIndex] = {
                            ...step,
                            fields
                          };
                          
                          return {
                            ...prev,
                            steps: newSteps
                          };
                        });
                      }}
                    >
                      <SortableContext
                        items={step.fields.map((_, index) => index.toString())}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-4">
                          {step.fields.map((field, fieldIndex) => (
                            <SortableField
                              key={fieldIndex}
                              fieldId={fieldIndex.toString()}
                              field={field}
                            >
                              <div className="w-full">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{field.label || 'Unnamed Field'}</span>
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => setExpandedField(expandedField === `${stepIndex}-${fieldIndex}` ? null : `${stepIndex}-${fieldIndex}`)}
                                      className="p-1 hover:bg-gray-200 rounded-md transition-colors"
                                    >
                                      {expandedField === `${stepIndex}-${fieldIndex}` ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                                    </button>
                                    <button
                                      onClick={() => removeField(stepIndex, fieldIndex)}
                                      className="p-1 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                </div>
  
                                {expandedField === `${stepIndex}-${fieldIndex}` && (
                                  <div className="mt-4 space-y-4">
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="block text-sm font-medium mb-1">Label</label>
                                        <input
                                          type="text"
                                          value={field.label || ''}
                                          onChange={(e) => handleFieldChange(stepIndex, fieldIndex, 'label', e.target.value)}
                                          className="w-full p-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium mb-1">Name</label>
                                        <input
                                          type="text"
                                          value={field.name || ''}
                                          onChange={(e) => handleFieldChange(stepIndex, fieldIndex, 'name', e.target.value)}
                                          className="w-full p-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                      </div>
                                    </div>
  
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="block text-sm font-medium mb-1">Type</label>
                                        <select
                                          value={field.type}
                                          onChange={(e) => handleFieldChange(stepIndex, fieldIndex, 'type', e.target.value)}
                                          className="w-full p-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        >
                                          <option value="text">Text</option>
                                          <option value="textarea">Textarea</option>
                                          <option value="number">Number</option>
                                          <option value="email">Email</option>
                                          <option value="tel">Telephone</option>
                                          <option value="date">Date</option>
                                          <option value="checkbox">Checkbox</option>
                                          <option value="radio">Radio</option>
                                          <option value="select">Select</option>
                                        </select>
                                      </div>
                                      <div className="flex items-center">
                                        <label className="inline-flex items-center">
                                          <input
                                            type="checkbox"
                                            checked={field.required || false}
                                            onChange={(e) => handleFieldChange(stepIndex, fieldIndex, 'required', e.target.checked)}
                                            className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
                                          />
                                          <span className="ml-2 text-sm font-medium text-gray-700">Required</span>
                                        </label>
                                      </div>
                                    </div>
  
                                    {(field.type === 'select' || field.type === 'radio') && (
                                      <div>
                                        <label className="block text-sm font-medium mb-2">Options</label>
                                        {field.options?.map((option, optIndex) => (
                                          <div key={optIndex} className="flex gap-2 mb-2">
                                            <input
                                              type="text"
                                              value={option.label || ''}
                                              onChange={(e) => {
                                                const newOptions = [...(field.options || [])];
                                                newOptions[optIndex] = {
                                                  value: e.target.value.toLowerCase().replace(/\s+/g, '-'),
                                                  label: e.target.value
                                                };
                                                handleFieldChange(stepIndex, fieldIndex, 'options', newOptions);
                                              }}
                                              className="flex-1 p-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                              placeholder="Option label"
                                            />
                                            <button
                                              onClick={() => {
                                                const newOptions = field.options.filter((_, i) => i !== optIndex);
                                                handleFieldChange(stepIndex, fieldIndex, 'options', newOptions);
                                              }}
                                              className="p-2 text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                            >
                                              <Trash2 size={16} />
                                            </button>
                                          </div>
                                        ))}
                                        <button
                                          onClick={() => {
                                            const newOptions = [...(field.options || []), { value: '', label: '' }];
                                            handleFieldChange(stepIndex, fieldIndex, 'options', newOptions);
                                          }}
                                          className="flex items-center gap-2 text-sm text-blue-500 hover:text-blue-600"
                                      >
                                        <Plus size={14} /> Add Option
                                      </button>
                                    </div>
                                  )}

                                  <div>
                                    <label className="block text-sm font-medium mb-1">Hint Text</label>
                                    <input
                                      type="text"
                                      value={field.hint || ''}
                                      onChange={(e) => handleFieldChange(stepIndex, fieldIndex, 'hint', e.target.value)}
                                      className="w-full p-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      placeholder="Helper text shown below the field"
                                    />
                                  </div>

                                  {/* Conditional Display */}
                                  <div>
                                    <label className="block text-sm font-medium mb-2">Conditional Display</label>
                                    <div className="space-y-2">
                                      <div>
                                        <label className="inline-flex items-center">
                                          <input
                                            type="checkbox"
                                            checked={!!field.conditional}
                                            onChange={(e) => {
                                              if (e.target.checked) {
                                                handleFieldChange(stepIndex, fieldIndex, 'conditional', {
                                                  field: '',
                                                  value: ''
                                                });
                                              } else {
                                                const updatedField = { ...field };
                                                delete updatedField.conditional;
                                                handleFieldChange(stepIndex, fieldIndex, 'conditional', undefined);
                                              }
                                            }}
                                            className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
                                          />
                                          <span className="ml-2 text-sm text-gray-700">Show this field conditionally</span>
                                        </label>
                                      </div>

                                      {field.conditional && (
                                        <div className="grid grid-cols-2 gap-4 mt-2">
                                          <div>
                                            <select
                                              value={field.conditional.field || ''}
                                              onChange={(e) => {
                                                handleFieldChange(stepIndex, fieldIndex, 'conditional', {
                                                  ...field.conditional,
                                                  field: e.target.value
                                                });
                                              }}
                                              className="w-full p-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            >
                                              <option value="">Select field</option>
                                              {formData.steps.flatMap((step, sIndex) => 
                                                step.fields.map((f, fIndex) => 
                                                  sIndex < stepIndex || (sIndex === stepIndex && fIndex < fieldIndex) ? (
                                                    <option key={`${sIndex}-${fIndex}`} value={f.name}>
                                                      {f.label || f.name}
                                                    </option>
                                                  ) : null
                                                )
                                              ).filter(Boolean)}
                                            </select>
                                          </div>
                                          <div>
                                            <input
                                              type="text"
                                              value={field.conditional.value || ''}
                                              onChange={(e) => {
                                                handleFieldChange(stepIndex, fieldIndex, 'conditional', {
                                                  ...field.conditional,
                                                  value: e.target.value
                                                });
                                              }}
                                              className="w-full p-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                              placeholder="Value to match"
                                            />
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Validation Rules */}
                                  <div>
                                    <label className="block text-sm font-medium mb-2">Validation Rules</label>
                                    <div className="space-y-2">
                                      {['email', 'phoneNumber', 'postalCode'].map(rule => (
                                        <div key={rule}>
                                          <label className="inline-flex items-center">
                                            <input
                                              type="checkbox"
                                              checked={field.validation?.rules?.includes(rule) || false}
                                              onChange={(e) => {
                                                const currentRules = field.validation?.rules || [];
                                                const updatedRules = e.target.checked
                                                  ? [...currentRules, rule]
                                                  : currentRules.filter(r => r !== rule);
                                                handleFieldChange(stepIndex, fieldIndex, 'validation', {
                                                  ...field.validation,
                                                  rules: updatedRules
                                                });
                                              }}
                                              className="w-4 h-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
                                            />
                                            <span className="ml-2 text-sm text-gray-700">
                                              {rule.charAt(0).toUpperCase() + rule.slice(1)} validation
                                            </span>
                                          </label>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </div>
                          </SortableField>
                        ))}
                      </div>
                    </SortableContext>

                    <DragOverlay>
                      {activeId && (
                        <div className="bg-gray-50 rounded-lg p-4 border-2 border-blue-500 opacity-50">
                          <div className="flex items-center gap-2">
                            <GripVertical className="text-gray-400" size={16} />
                            <span className="font-medium">
                              {step.fields[parseInt(activeId)]?.label || 'Unnamed Field'}
                            </span>
                          </div>
                        </div>
                      )}
                    </DragOverlay>
                  </DndContext>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    ) : (
      <FormPreview formData={formData} />
    )}
  </div>
);
};

export default FormEditor;