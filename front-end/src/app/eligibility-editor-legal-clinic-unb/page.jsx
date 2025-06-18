"use client"

import React, { useState, useEffect, useRef } from 'react';
import { 
  // Lucide Icons
  Lock, Eye, EyeOff, Key,
  Trash2, Plus, GripVertical, ChevronDown, ChevronUp,
  Eye as EyeIcon, Settings, Save, User, Shield, Phone, Mail,
  DollarSign, Scale, FileText, BriefcaseIcon, AlertCircle,
  RefreshCcw, CheckCircle, ChevronRight, Copy, X, Send,
  Layers, Move, MoreHorizontal, Edit, PlusSquare, ArrowDown,
  ArrowUp, Square, Bookmark, List, Folder, FolderPlus, 
  Info, AlertTriangle
} from 'lucide-react';
import { saveFormData, getFormData } from './formHelper';

// DND Kit imports
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Icon mapping
const ICONS = {
  User,
  Shield,
  Phone,
  Mail,
  DollarSign,
  Scale,
  FileText,
  BriefcaseIcon,
  AlertCircle,
  Send
};

// Initial state structure - now with support for substeps
const initialState = {
  CONSTANTS: {
    INCOME: {
      MIN_ANNUAL: 0,
      MAX_ANNUAL: 42000,
      PER_DEPENDENT: 5000
    },
    AGE: {
      MIN: 18,
      MAX: 120
    },
    HOUSEHOLD: {
      MAX_DEPENDENTS: 10,
      MIN_SIZE: 1,
      MAX_SIZE: 6
    }
  },
  MONTHLY_THRESHOLDS: {
    "1": { income: 1900, assets: 5000 },
    "2": { income: 2800, assets: 9000 },
    "3": { income: 2900, assets: 10000 },
    "4": { income: 3100, assets: 11000 },
    "5": { income: 3300, assets: 12000 },
    "6": { income: 3500, assets: 13000 }
  },
  RESOURCES: {
    Shelters: [],
    legal: [],
    emergency: []
  },
  formConfig: {
    metadata: {
      version: "1.0.0",
      lastUpdated: new Date().toISOString(),
      clinic: {
        name: "Legal Clinic Intake Form",
        phone: "",
        email: "",
        address: ""
      }
    },
    steps: [{
      id: "step_1",
      title: "Basic Information",
      icon: "User",
      fields: [],
      substeps: [] // New: support for substeps
    }]
  }
};

// Custom UI Components using only Tailwind
// Custom Alert Component
const Alert = ({ children, variant = "default" }) => {
  const bgColor = variant === "destructive" ? "bg-red-50 border-red-300" : "bg-blue-50 border-blue-300";
  const textColor = variant === "destructive" ? "text-red-700" : "text-blue-700";
  
  return (
    <div className={`p-4 rounded-md border ${bgColor} ${textColor}`}>
      {children}
    </div>
  );
};

const AlertDescription = ({ children }) => {
  return <div className="ml-6 text-sm">{children}</div>;
};

// Custom Badge Component
const Badge = ({ children, className = "" }) => {
  return (
    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${className}`}>
      {children}
    </span>
  );
};

// Custom Card Components
const Card = ({ children, className = "" }) => {
  return (
    <div className={`bg-white border border-gray-200 rounded-lg shadow-sm ${className}`}>
      {children}
    </div>
  );
};

const CardHeader = ({ children, className = "" }) => {
  return <div className={`p-4 border-b ${className}`}>{children}</div>;
};

const CardTitle = ({ children }) => {
  return <h3 className="text-lg font-semibold">{children}</h3>;
};

const CardContent = ({ children, className = "" }) => {
  return <div className={`p-4 ${className}`}>{children}</div>;
};

// Custom Tooltip Component
const Tooltip = ({ children, text }) => {
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef(null);
  
  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      
      {isVisible && (
        <div 
          ref={tooltipRef}
          className="absolute z-10 px-2 py-1 text-xs text-white bg-gray-900 rounded shadow-lg -mt-1 transform -translate-y-full"
        >
          {text}
          <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-1/2 rotate-45 w-2 h-2 bg-gray-900"></div>
        </div>
      )}
    </div>
  );
};

// Custom Collapsible Component
const Collapsible = ({ children, defaultOpen = false, className = "" }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div className={`collapsible ${className}`} data-state={isOpen ? "open" : "closed"}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          if (child.type === CollapsibleTrigger) {
            return React.cloneElement(child, { 
              isOpen, 
              onClick: () => setIsOpen(!isOpen) 
            });
          }
          if (child.type === CollapsibleContent) {
            return React.cloneElement(child, { isOpen });
          }
        }
        return child;
      })}
    </div>
  );
};

const CollapsibleTrigger = ({ children, isOpen, onClick, className = "" }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center ${className}`}
    >
      {React.Children.map(children, child => {
        if (React.isValidElement(child) && child.type === ChevronRight) {
          return React.cloneElement(child, { 
            className: `transform transition-transform ${isOpen ? 'rotate-90' : ''}`,
          });
        }
        return child;
      })}
    </button>
  );
};

const CollapsibleContent = ({ children, isOpen, className = "" }) => {
  if (!isOpen) return null;
  
  return (
    <div className={`mt-2 ${className}`}>
      {children}
    </div>
  );
};

// Sortable Components for drag-and-drop
// Enhanced SortableField component with support for nested structures
const SortableField = ({ field, stepIndex, substepIndex, fieldIndex, children }) => {
  // Create a unique identifier for each sortable field
  const id = substepIndex !== undefined 
    ? `${stepIndex}-${substepIndex}-${fieldIndex}` 
    : `${stepIndex}-${fieldIndex}`;
  
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: id,
    data: {
      type: 'field',
      stepIndex,
      substepIndex,
      fieldIndex,
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
      <div className={`bg-gray-50 rounded-lg p-4 ${isDragging ? 'border-2 border-blue-500 shadow-lg' : 'border border-gray-200'}`}>
        <div className="flex items-center justify-between cursor-move" {...listeners}>
          {children}
        </div>
      </div>
    </div>
  );
};

// SortableStep component for main steps reordering
const SortableStep = ({ step, stepIndex, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: `step-${stepIndex}`,
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
      <div className={`rounded-lg mb-6 ${isDragging ? 'border-2 border-blue-500 shadow-lg' : ''}`}>
        <div className="cursor-move bg-blue-50 rounded-t-lg p-2 border border-blue-200" {...listeners}>
          <div className="flex items-center gap-2">
            <GripVertical className="text-blue-400" size={16} />
            <span className="font-medium text-blue-700">Drag to reorder step</span>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};

// SortableSubstep component
const SortableSubstep = ({ substep, stepIndex, substepIndex, children }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ 
    id: `substep-${stepIndex}-${substepIndex}`,
    data: {
      type: 'substep',
      stepIndex,
      substepIndex,
      substep
    }
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <div className={`rounded-lg mb-4 ml-8 ${isDragging ? 'border-2 border-blue-500 shadow-lg' : ''}`}>
        <div className="cursor-move bg-green-50 rounded-t-lg p-2 border border-green-200" {...listeners}>
          <div className="flex items-center gap-2">
            <GripVertical className="text-green-400" size={16} />
            <span className="font-medium text-green-700">Drag to reorder substep</span>
          </div>
        </div>
        {children}
      </div>
    </div>
  );
};

// Enhanced Field Properties Editor
const FieldPropertiesEditor = ({ field, onSave, onCancel }) => {
  const [fieldData, setFieldData] = useState(field || {});
  const [optionToAdd, setOptionToAdd] = useState({ label: '', value: '' });
  
  const updateField = (key, value) => {
    setFieldData({
      ...fieldData,
      [key]: value
    });
  };

  const addOption = () => {
    if (optionToAdd.label && optionToAdd.value) {
      const options = [...(fieldData.options || []), optionToAdd];
      setFieldData({
        ...fieldData,
        options
      });
      setOptionToAdd({ label: '', value: '' });
    }
  };

  const removeOption = (index) => {
    const options = [...fieldData.options];
    options.splice(index, 1);
    setFieldData({
      ...fieldData,
      options
    });
  };

  const addValidationRule = (rule) => {
    const validation = fieldData.validation || { rules: [] };
    const rules = [...validation.rules, rule];
    setFieldData({
      ...fieldData,
      validation: {
        ...validation,
        rules
      }
    });
  };

  const removeValidationRule = (index) => {
    const validation = { ...fieldData.validation };
    validation.rules.splice(index, 1);
    setFieldData({
      ...fieldData,
      validation
    });
  };

  return (
    <div className="space-y-6 overflow-y-auto">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Field Name (ID)</label>
          <input
            type="text"
            value={fieldData.name || ''}
            onChange={(e) => updateField('name', e.target.value)}
            className="w-full p-2 border rounded"
          />
          <p className="text-xs text-gray-500 mt-1">
            Unique identifier for this field
          </p>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Field Label</label>
          <input
            type="text"
            value={fieldData.label || ''}
            onChange={(e) => updateField('label', e.target.value)}
            className="w-full p-2 border rounded"
          />
          <p className="text-xs text-gray-500 mt-1">
            Text shown to the user
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Field Type</label>
          <select
            value={fieldData.type || 'text'}
            onChange={(e) => updateField('type', e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="currency">Currency</option>
            <option value="email">Email</option>
            <option value="tel">Telephone</option>
            <option value="date">Date</option>
            <option value="select">Select</option>
            <option value="radio">Radio Buttons</option>
            <option value="checkbox">Checkbox</option>
            <option value="textarea">Text Area</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Required</label>
          <div className="flex items-center h-10 mt-1">
            <input
              type="checkbox"
              checked={fieldData.required || false}
              onChange={(e) => updateField('required', e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="ml-2 text-sm text-gray-700">Field is required</span>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Guidance Text</label>
        <textarea
          value={fieldData.guidance || ''}
          onChange={(e) => updateField('guidance', e.target.value)}
          className="w-full p-2 border rounded h-24"
          placeholder="Help text to guide the user"
        />
      </div>

      {/* Conditional logic */}
      {/* <div>
        <label className="block text-sm font-medium mb-1">Show If (Conditional Logic)</label>
        <input
          type="text"
          value={fieldData.showIf || ''}
          onChange={(e) => updateField('showIf', e.target.value)}
          className="w-full p-2 border rounded"
          placeholder="e.g., hasDeadline === 'yes'"
        />
        <p className="text-xs text-gray-500 mt-1">
          JavaScript condition to determine if this field should be displayed
        </p>
      </div> */}

      {/* Validation Rules */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-sm font-medium">Validation Rules</label>
          <div className="flex gap-2">
            <select 
              className="text-xs p-1 border rounded"
              value=""
              onChange={(e) => {
                if (e.target.value) {
                  addValidationRule(e.target.value);
                  e.target.value = "";
                }
              }}
            >
              <option value="">Add rule...</option>
              <option value="email">Email</option>
              <option value="phoneNumber">Phone Number</option>
              <option value="postalCode">Postal Code</option>
              <option value="dateOfBirth">Date of Birth</option>
              <option value="required">Required</option>
              <option value="numeric">Numeric</option>
            </select>
          </div>
        </div>
        
        <div className="space-y-2">
          {fieldData.validation?.rules?.map((rule, index) => (
            <div key={index} className="flex items-center justify-between bg-gray-50 p-2 rounded">
              <span className="text-sm">{rule}</span>
              <button 
                onClick={() => removeValidationRule(index)}
                className="text-red-500 hover:text-red-700"
              >
                <X size={14} />
              </button>
            </div>
          ))}
          {(!fieldData.validation?.rules || fieldData.validation.rules.length === 0) && (
            <p className="text-sm text-gray-500 italic">No validation rules added</p>
          )}
        </div>
      </div>

      {/* Options for select/radio/checkbox */}
      {(fieldData.type === 'select' || fieldData.type === 'radio') && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium">Options</label>
          </div>
          
          <div className="space-y-3 mb-4">
            {fieldData.options?.map((option, index) => (
              <div key={index} className="flex items-center gap-2 bg-gray-50 p-2 rounded">
                <div className="flex-1">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={option.value}
                      onChange={(e) => {
                        const options = [...fieldData.options];
                        options[index].value = e.target.value;
                        updateField('options', options);
                      }}
                      className="w-full p-1 border rounded text-sm"
                      placeholder="Value"
                    />
                    <input
                      type="text"
                      value={option.label}
                      onChange={(e) => {
                        const options = [...fieldData.options];
                        options[index].label = e.target.value;
                        updateField('options', options);
                      }}
                      className="w-full p-1 border rounded text-sm"
                      placeholder="Label"
                    />
                  </div>
                </div>
                <button 
                  onClick={() => removeOption(index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
          
          <div className="flex items-end gap-2 border-t pt-3">
            <div className="flex-1">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs mb-1">Value</label>
                  <input
                    type="text"
                    value={optionToAdd.value}
                    onChange={(e) => setOptionToAdd({...optionToAdd, value: e.target.value})}
                    className="w-full p-1 border rounded text-sm"
                    placeholder="Option value"
                  />
                </div>
                <div>
                  <label className="block text-xs mb-1">Label</label>
                  <input
                    type="text"
                    value={optionToAdd.label}
                    onChange={(e) => setOptionToAdd({...optionToAdd, label: e.target.value})}
                    className="w-full p-1 border rounded text-sm"
                    placeholder="Option label"
                  />
                </div>
              </div>
            </div>
            <button
              onClick={addOption}
              disabled={!optionToAdd.label || !optionToAdd.value}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm disabled:bg-gray-300"
            >
              Add
            </button>
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4 border-t">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(fieldData)}
          className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm"
        >
          Save Field
        </button>
      </div>
    </div>
  );
};

// Custom Substep Editor
const SubstepEditor = ({ substep, stepIndex, substepIndex, onSave, onCancel }) => {
  const [substepData, setSubstepData] = useState(substep || {
    id: `substep_${Date.now()}`,
    title: '',
    fields: []
  });

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Substep Title</label>
        <input
          type="text"
          value={substepData.title}
          onChange={(e) => setSubstepData({ ...substepData, title: e.target.value })}
          className="w-full p-2 border rounded"
        />
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm"
        >
          Cancel
        </button>
        <button
          onClick={() => onSave(substepData)}
          className="px-4 py-2 bg-blue-500 text-white rounded-md text-sm"
        >
          Save Substep
        </button>
      </div>
    </div>
  );
};

// Enhanced FormPreview component with substep support
const FormPreview = ({ formData }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [activeSubstep, setActiveSubstep] = useState(0);
  const [formValues, setFormValues] = useState({});
  const [errors, setErrors] = useState({});
  const [showEmergencyAlert, setShowEmergencyAlert] = useState(false);
  const [activeResources, setActiveResources] = useState([]);

  // Check if there are form steps available
  if (!formData?.formConfig?.steps?.length) {
    return (
      <div className="max-w-2xl mx-auto p-6">
        <Alert variant="destructive">
          <div className="flex items-center">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              No form steps have been created yet. Add some steps in the editor to get started.
            </AlertDescription>
          </div>
        </Alert>
      </div>
    );
  }

  // Determine if current step has substeps
  const currentStep = formData.formConfig.steps[activeStep];
  const hasSubsteps = currentStep.substeps && currentStep.substeps.length > 0;
  
  // Get the current fields based on whether we're in a substep or main step
  const currentFields = hasSubsteps 
    ? currentStep.substeps[activeSubstep].fields
    : currentStep.fields;

  const handleInputChange = (name, value) => {
    setFormValues(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when field is modified
    if (errors[name]) {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }

    // Handle emergency situations and resources
    if (name === 'immediateRisk' && value === 'yes') {
      setShowEmergencyAlert(true);
      setActiveResources(formData.RESOURCES.emergency || []);
    } else if (name === 'shelterNeeded' && value === 'yes') {
      setActiveResources(prev => [...prev, ...(formData.RESOURCES.Shelters || [])]);
    } else if (name === 'legalIssueType') {
      setActiveResources(formData.RESOURCES.legal || []);
    }
  };

  const validateStep = () => {
    const fieldsToValidate = currentFields;
    const newErrors = {};
    let isValid = true;

    fieldsToValidate.forEach(field => {
      if (field.required && !formValues[field.name]) {
        newErrors[field.name] = `${field.label} is required`;
        isValid = false;
      }

      if (field.validation?.rules) {
        field.validation.rules.forEach(rule => {
          switch (rule) {
            case 'email':
              if (formValues[field.name] && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formValues[field.name])) {
                newErrors[field.name] = 'Please enter a valid email address';
                isValid = false;
              }
              break;
            case 'phoneNumber':
              if (formValues[field.name] && !/^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/.test(formValues[field.name])) {
                newErrors[field.name] = 'Please enter a valid phone number in format: (XXX) XXX-XXXX';
                isValid = false;
              }
              break;
            case 'postalCode':
              if (formValues[field.name] && !/^[A-Za-z]\d[A-Za-z] \d[A-Za-z]\d$/.test(formValues[field.name])) {
                newErrors[field.name] = 'Please enter a valid postal code in format: A1A 1A1';
                isValid = false;
              }
              break;
            case 'dateOfBirth':
              if (formValues[field.name]) {
                const birthDate = new Date(formValues[field.name]);
                const today = new Date();
                let age = today.getFullYear() - birthDate.getFullYear();
                const monthDiff = today.getMonth() - birthDate.getMonth();
                
                if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                  age--;
                }

                if (age < formData.CONSTANTS.AGE.MIN || age > formData.CONSTANTS.AGE.MAX) {
                  newErrors[field.name] = `Age must be between ${formData.CONSTANTS.AGE.MIN} and ${formData.CONSTANTS.AGE.MAX} years`;
                  isValid = false;
                }
              }
              break;
          }
        });
      }
    });

    setErrors(newErrors);
    return isValid;
  };

  // Enhanced navigation to handle substeps
  const handleNext = () => {
    if (validateStep()) {
      if (hasSubsteps && activeSubstep < currentStep.substeps.length - 1) {
        // Move to next substep
        setActiveSubstep(prev => prev + 1);
      } else {
        // Move to next main step
        setActiveStep(prev => Math.min(prev + 1, formData.formConfig.steps.length - 1));
        setActiveSubstep(0); // Reset substep when changing main steps
      }
    }
  };

  const handlePrevious = () => {
    if (activeSubstep > 0) {
      // Move to previous substep
      setActiveSubstep(prev => prev - 1);
    } else {
      // Move to previous main step
      setActiveStep(prev => Math.max(0, prev - 1));
      // If previous step has substeps, set to the last substep
      const prevStep = formData.formConfig.steps[activeStep - 1];
      if (prevStep && prevStep.substeps && prevStep.substeps.length > 0) {
        setActiveSubstep(prevStep.substeps.length - 1);
      } else {
        setActiveSubstep(0);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateStep()) {
      // Form submission logic here
    }
  };

  const renderField = (field, index) => {
    const fieldProps = {
      id: field.name,
      name: field.name,
      value: formValues[field.name] || '',
      onChange: (e) => handleInputChange(field.name, e.target.type === 'checkbox' ? e.target.checked : e.target.value),
      className: `w-full p-2 border rounded-md ${
        errors[field.name] ? 'border-red-500' : 'border-gray-300'
      }`
    };

    const renderFieldInput = () => {
      switch (field.type) {
        case 'tel':
          return (
            <div>
              <input
                type="tel"
                {...fieldProps}
                placeholder="(123) 456-7890"
              />
              <p className="text-xs text-gray-500 mt-1">Format: (XXX) XXX-XXXX</p>
            </div>
          );

        case 'date':
          return (
            <div>
              <input
                type="date"
                {...fieldProps}
              />
              {field.name === 'dateOfBirth' && (
                <p className="text-xs text-gray-500 mt-1">
                  Age must be between {formData.CONSTANTS.AGE.MIN} and {formData.CONSTANTS.AGE.MAX} years
                </p>
              )}
            </div>
          );

        case 'email':
          return (
            <input
              type="email"
              {...fieldProps}
              placeholder="example@email.com"
            />
          );

        case 'number':
          if (field.name.toLowerCase().includes('amount') || 
              field.name.toLowerCase().includes('income') || 
              field.name.toLowerCase().includes('expense') || 
              field.name.toLowerCase().includes('assets')) {
            return (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  {...fieldProps}
                  className={`${fieldProps.className} pl-8`}
                  min="0"
                  step="0.01"
                />
              </div>
            );
          }
          return <input type="number" {...fieldProps} />;
        
        case 'currency':
            return (
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
                <input
                  type="number"
                  {...fieldProps}
                  className={`${fieldProps.className} pl-8`}
                  min="0"
                  step="0.01"
                />
              </div>
            );

        case 'textarea':
          return <textarea {...fieldProps} rows={4} />;

        case 'select':
          return (
            <select {...fieldProps}>
              <option value="">Select {field.label}</option>
              {field.options?.map((option, i) => (
                <option key={i} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          );

        case 'radio':
          return (
            <div className="space-y-2">
              {field.options?.map((option, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="radio"
                    id={`${field.name}-${option.value}`}
                    name={field.name}
                    value={option.value}
                    checked={formValues[field.name] === option.value}
                    onChange={(e) => handleInputChange(field.name, e.target.value)}
                    className="w-4 h-4 text-blue-600"
                  />
                  <label htmlFor={`${field.name}-${option.value}`} className="text-sm">
                    {option.label}
                  </label>
                </div>
              ))}
            </div>
          );

        case 'checkbox':
          return (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                {...fieldProps}
                checked={formValues[field.name] || false}
                className="w-4 h-4 rounded border-gray-300 text-blue-600"
              />
              <label htmlFor={field.name} className="text-sm">
                {field.label}
              </label>
            </div>
          );

        default:
          if (field.name === 'postalCode') {
            return (
              <div>
                <input
                  type="text"
                  {...fieldProps}
                  placeholder="A1A 1A1"
                />
                <p className="text-xs text-gray-500 mt-1">Format: A1A 1A1</p>
              </div>
            );
          }
          return <input type="text" {...fieldProps} />;
      }
    };

    return (
      <div key={index} className="space-y-2">
        {field.type !== 'checkbox' && (
          <label className="block text-sm font-medium text-gray-700">
            {field.label}
            {field.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}

        {field.guidance && (
          <p className="text-sm text-gray-500 mb-2">{field.guidance}</p>
        )}

        {renderFieldInput()}

        {errors[field.name] && (
          <p className="text-sm text-red-500">{errors[field.name]}</p>
        )}
      </div>
    );
  };

  // Get substep title if applicable
  const getSubstepTitle = () => {
    if (hasSubsteps) {
      return currentStep.substeps[activeSubstep].title;
    }
    return null;
  };

  // Render the progress steps with enhanced substep support
  const renderProgressSteps = () => {
    return (
      <div className="border-b bg-gray-50">
        <div className="px-6 py-4">
          <div className="flex flex-wrap gap-2">
            {formData.formConfig.steps.map((step, index) => {
              const Icon = ICONS[step.icon] || User;
              const isActiveMainStep = activeStep === index;
              const isPastMainStep = activeStep > index;
              const hasSubsteps = step.substeps && step.substeps.length > 0;

              return (
                <div key={step.id} className="flex flex-col">
                  <button
                    onClick={() => {
                      if (validateStep() || isPastMainStep) {
                        setActiveStep(index);
                        setActiveSubstep(0);
                      }
                    }}
                    disabled={!isPastMainStep && !isActiveMainStep}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors ${
                      isActiveMainStep 
                        ? 'bg-blue-500 text-white' 
                        : isPastMainStep
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                    }`}
                  >
                    <Icon size={14} />
                    <span className="font-medium">{step.title}</span>
                  </button>
                  
                  {/* Render substep indicators if on active step and has substeps */}
                  {isActiveMainStep && hasSubsteps && (
                    <div className="flex ml-6 mt-2 gap-1">
                      {step.substeps.map((substep, substepIdx) => (
                        <div 
                          key={`substep-${substepIdx}`}
                          className={`h-2 w-2 rounded-full ${
                            substepIdx === activeSubstep 
                              ? 'bg-blue-500' 
                              : substepIdx < activeSubstep 
                                ? 'bg-green-500' 
                                : 'bg-gray-300'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto flex gap-6">
      {/* Main Form Content */}
      <div className="flex-1 bg-white rounded-lg shadow-sm overflow-hidden">
        {/* Form Header */}
        <div className="border-b p-6">
          <h2 className="text-xl font-semibold text-gray-900">
            {formData.formConfig.metadata.clinic.name}
          </h2>
          {formData.formConfig.metadata.clinic.phone && (
            <p className="text-sm text-gray-500 mt-1">
              Contact: {formData.formConfig.metadata.clinic.phone}
              {formData.formConfig.metadata.clinic.email && 
                ` | ${formData.formConfig.metadata.clinic.email}`}
            </p>
          )}
        </div>

        {/* Progress Steps */}
        {renderProgressSteps()}

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6 max-w-2xl">
            {/* Show substep title if applicable */}
            {getSubstepTitle() && (
              <div className="mb-4">
                <h3 className="text-lg font-medium text-gray-700 flex items-center">
                  <ChevronRight size={18} className="mr-1 text-blue-500" />
                  {getSubstepTitle()}
                </h3>
              </div>
            )}
            
            {/* Render fields */}
            {currentFields.map((field, index) => 
              renderField(field, index)
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            {(activeStep > 0 || activeSubstep > 0) && (
              <button
                type="button"
                onClick={handlePrevious}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Previous
              </button>
            )}
            
            {(activeStep < formData.formConfig.steps.length - 1 || 
              (hasSubsteps && activeSubstep < currentStep.substeps.length - 1)) ? (
              <button
                type="button"
                onClick={handleNext}
                className="ml-auto px-4 py-2 text-sm font-medium text-white bg-blue-500 rounded-md hover:bg-blue-600"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                className="ml-auto px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-md hover:bg-green-600"
              >
                Submit
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Resources Sidebar */}
      {(showEmergencyAlert || activeResources.length > 0) && (
        <div className="w-80 shrink-0">
          {showEmergencyAlert && (
            <Alert variant="destructive">
              <div className="flex items-center">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  If you are in immediate danger, please call emergency services (911) immediately.
                </AlertDescription>
              </div>
            </Alert>
          )}

          {activeResources.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Available Resources</CardTitle>
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
                      {resource.email && (
                        <p className="text-sm text-gray-600">
                          Email: {resource.email}
                        </p>
                      )}
                      {resource.matters && (
                        <p className="text-sm text-gray-600">
                          Matters: {resource.matters}
                        </p>
                      )}
                      {resource.notes && (
                        <p className="text-sm text-gray-600 mt-1">
                          {resource.notes}
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

// Constants Editor Component using only Tailwind
const ConstantsEditor = ({ constants, onChange }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Constants Configuration</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Income Settings */}
          <div className="space-y-4">
            <h3 className="font-semibold">Income Settings</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm mb-1">Min Annual</label>
                <input
                  type="number"
                  value={constants.INCOME.MIN_ANNUAL}
                  onChange={(e) => {
                    onChange({
                      ...constants,
                      INCOME: {
                        ...constants.INCOME,
                        MIN_ANNUAL: parseInt(e.target.value)
                      }
                    });
                  }}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Max Annual</label>
                <input
                  type="number"
                  value={constants.INCOME.MAX_ANNUAL}
                  onChange={(e) => {
                    onChange({
                      ...constants,
                      INCOME: {
                        ...constants.INCOME,
                        MAX_ANNUAL: parseInt(e.target.value)
                      }
                    });
                  }}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Per Dependent</label>
                <input
                  type="number"
                  value={constants.INCOME.PER_DEPENDENT}
                  onChange={(e) => {
                    onChange({
                      ...constants,
                      INCOME: {
                        ...constants.INCOME,
                        PER_DEPENDENT: parseInt(e.target.value)
                      }
                    });
                  }}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          </div>

          {/* Age Settings */}
          <div className="space-y-4">
            <h3 className="font-semibold">Age Settings</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm mb-1">Min Age</label>
                <input
                  type="number"
                  value={constants.AGE.MIN}
                  onChange={(e) => {
                    onChange({
                      ...constants,
                      AGE: {
                        ...constants.AGE,
                        MIN: parseInt(e.target.value)
                      }
                    });
                  }}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Max Age</label>
                <input
                  type="number"
                  value={constants.AGE.MAX}
                  onChange={(e) => {
                    onChange({
                      ...constants,
                      AGE: {
                        ...constants.AGE,
                        MAX: parseInt(e.target.value)
                      }
                    });
                  }}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          </div>

          {/* Household Settings */}
          <div className="space-y-4">
            <h3 className="font-semibold">Household Settings</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm mb-1">Max Dependents</label>
                <input
                  type="number"
                  value={constants.HOUSEHOLD.MAX_DEPENDENTS}
                  onChange={(e) => {
                    onChange({
                      ...constants,
                      HOUSEHOLD: {
                        ...constants.HOUSEHOLD,
                        MAX_DEPENDENTS: parseInt(e.target.value)
                      }
                    });
                  }}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Min Size</label>
                <input
                  type="number"
                  value={constants.HOUSEHOLD.MIN_SIZE}
                  onChange={(e) => {
                    onChange({
                      ...constants,
                      HOUSEHOLD: {
                        ...constants.HOUSEHOLD,
                        MIN_SIZE: parseInt(e.target.value)
                      }
                    });
                  }}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div>
                <label className="block text-sm mb-1">Max Size</label>
                <input
                  type="number"
                  value={constants.HOUSEHOLD.MAX_SIZE}
                  onChange={(e) => {
                    onChange({
                      ...constants,
                      HOUSEHOLD: {
                        ...constants.HOUSEHOLD,
                        MAX_SIZE: parseInt(e.target.value)
                      }
                    });
                  }}
                  className="w-full p-2 border rounded"
                />
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Thresholds Editor Component using only Tailwind
const ThresholdsEditor = ({ thresholds, onChange }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Monthly Thresholds</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Object.keys(thresholds).map((size) => (
            <div key={size} className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-3">Household Size: {size}</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm mb-1">Income Threshold</label>
                  <input
                    type="number"
                    value={thresholds[size].income}
                    onChange={(e) => {
                      const newThresholds = { ...thresholds };
                      newThresholds[size] = {
                        ...newThresholds[size],
                        income: parseInt(e.target.value)
                      };
                      onChange(newThresholds);
                    }}
                    className="w-full p-2 border rounded"
                  />
                </div>
                <div>
                  <label className="block text-sm mb-1">Assets Threshold</label>
                  <input
                    type="number"
                    value={thresholds[size].assets}
                    onChange={(e) => {
                      const newThresholds = { ...thresholds };
                      newThresholds[size] = {
                        ...newThresholds[size],
                        assets: parseInt(e.target.value)
                      };
                      onChange(newThresholds);
                    }}
                    className="w-full p-2 border rounded"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// Enhanced Resources Editor Component with custom collapsible sections
const ResourcesEditor = ({ resources, onChange }) => {
  const addResource = (category) => {
    const newResources = { ...resources };
    
    // Create a new resource with all possible fields
    const newResource = {
      name: "",
      phoneNumber: "",
      category,
      location: "",
      notes: "",
      description: "",
      email: "",
      matters: ""
    };
    
    newResources[category] = [
      ...(newResources[category] || []),
      newResource
    ];
    
    onChange(newResources);
  };

  const updateResource = (category, index, field, value) => {
    const newResources = { ...resources };
    newResources[category] = newResources[category].map((resource, i) => 
      i === index ? { ...resource, [field]: value } : resource
    );
    onChange(newResources);
  };

  const removeResource = (category, index) => {
    const newResources = { ...resources };
    newResources[category] = newResources[category].filter((_, i) => i !== index);
    onChange(newResources);
  };

  // Resource category component with collapsible sections
  const ResourceCategory = ({ category, title }) => {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
      <div className="mb-6">
        <div className="w-full">
          <div className="flex justify-between items-center mb-4">
            <button 
              type="button"
              onClick={() => setIsOpen(!isOpen)}
              className="flex items-center gap-2 text-lg font-medium"
            >
              <ChevronRight className={`text-blue-500 transform transition-transform ${isOpen ? 'rotate-90' : ''}`} size={18} />
              <h3>{title}</h3>
            </button>
            <button
              onClick={() => addResource(category)}
              className="flex items-center gap-2 text-blue-500 hover:bg-blue-50 px-3 py-1 rounded"
            >
              <Plus size={16} /> Add Resource
            </button>
          </div>
          
          {isOpen && (
            <div className="space-y-4">
              {resources[category]?.map((resource, index) => (
                <div key={index} className="p-4 bg-gray-50 rounded-lg">
                  <div className="mb-4">
                    <h4 className="font-medium text-blue-600 mb-2">
                      {resource.name || `New ${title.slice(0, -1)}`}
                    </h4>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm mb-1">Name</label>
                      <input
                        type="text"
                        value={resource.name || ""}
                        onChange={(e) => updateResource(category, index, 'name', e.target.value)}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={resource.phoneNumber || ""}
                        onChange={(e) => updateResource(category, index, 'phoneNumber', e.target.value)}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Location</label>
                      <input
                        type="text"
                        value={resource.location || ""}
                        onChange={(e) => updateResource(category, index, 'location', e.target.value)}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    <div>
                      <label className="block text-sm mb-1">Email</label>
                      <input
                        type="text"
                        value={resource.email || ""}
                        onChange={(e) => updateResource(category, index, 'email', e.target.value)}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                    {category === 'legal' && (
                      <div>
                        <label className="block text-sm mb-1">Matters</label>
                        <input
                          type="text"
                          value={resource.matters || ""}
                          onChange={(e) => updateResource(category, index, 'matters', e.target.value)}
                          className="w-full p-2 border rounded"
                        />
                      </div>
                    )}
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm mb-1">Description</label>
                    <textarea
                      value={resource.description || ""}
                      onChange={(e) => updateResource(category, index, 'description', e.target.value)}
                      className="w-full p-2 border rounded h-20"
                      placeholder="Enter a detailed description..."
                    />
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm mb-1">Notes</label>
                    <textarea
                      value={resource.notes || ""}
                      onChange={(e) => updateResource(category, index, 'notes', e.target.value)}
                      className="w-full p-2 border rounded h-20"
                      placeholder="Additional notes..."
                    />
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => removeResource(category, index)}
                      className="flex items-center gap-2 text-red-500 hover:bg-red-50 px-3 py-1 rounded"
                    >
                      <Trash2 size={16} /> Remove
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Resources</CardTitle>
      </CardHeader>
      <CardContent>
        <ResourceCategory category="emergency" title="Emergency Resources" />
        <ResourceCategory category="Shelters" title="Shelter Resources" />
        <ResourceCategory category="legal" title="Legal Resources" />
      </CardContent>
    </Card>
  );
};

// Enhanced Form Steps Editor Component with substep support
const FormStepsEditor = ({ formConfig, onChange }) => {
  const [expandedField, setExpandedField] = useState(null);
  const [activeId, setActiveId] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const [editingField, setEditingField] = useState(null);
  const [editingFieldData, setEditingFieldData] = useState(null);
  const [expandedSteps, setExpandedSteps] = useState({});
  const [expandedSubsteps, setExpandedSubsteps] = useState({});
  const [editingSubstep, setEditingSubstep] = useState(null);
  const [editingSubstepData, setEditingSubstepData] = useState(null);
  const [showFieldDialog, setShowFieldDialog] = useState(false);
  const [showSubstepDialog, setShowSubstepDialog] = useState(false);

  // Configure DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
    
    if (active.data?.current) {
      setDraggedItem(active.data.current);
    }
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over || active.id === over.id) {
      setActiveId(null);
      setDraggedItem(null);
      return;
    }

    const newFormConfig = { ...formConfig };
    const newSteps = [...formConfig.steps];

    // Handle field reordering or moving
    if (active.data.current.type === 'field' && over.data.current.type === 'field') {
      const { stepIndex: srcStepIndex, substepIndex: srcSubstepIndex, fieldIndex: srcFieldIndex } = active.data.current;
      const { stepIndex: destStepIndex, substepIndex: destSubstepIndex, fieldIndex: destFieldIndex } = over.data.current;
      
      // Source and destination arrays
      let srcFields, destFields;
      
      if (srcSubstepIndex !== undefined) {
        srcFields = [...newSteps[srcStepIndex].substeps[srcSubstepIndex].fields];
      } else {
        srcFields = [...newSteps[srcStepIndex].fields];
      }
      
      if (destSubstepIndex !== undefined) {
        destFields = srcStepIndex === destStepIndex && srcSubstepIndex === destSubstepIndex 
          ? srcFields  // Same container, use the source array we just created
          : [...newSteps[destStepIndex].substeps[destSubstepIndex].fields];
      } else {
        destFields = srcStepIndex === destStepIndex && srcSubstepIndex === undefined
          ? srcFields  // Same container, use the source array we just created
          : [...newSteps[destStepIndex].fields];
      }

      // Remove from source
      const [movedField] = srcFields.splice(srcFieldIndex, 1);
      
      // Add to destination
      if (srcStepIndex === destStepIndex && srcSubstepIndex === destSubstepIndex) {
        // Same container, adjust position
        srcFields.splice(destFieldIndex, 0, movedField);
        
        // Update the array in the config
        if (srcSubstepIndex !== undefined) {
          newSteps[srcStepIndex].substeps[srcSubstepIndex].fields = srcFields;
        } else {
          newSteps[srcStepIndex].fields = srcFields;
        }
      } else {
        // Different containers
        destFields.splice(destFieldIndex, 0, movedField);
        
        // Update source array
        if (srcSubstepIndex !== undefined) {
          newSteps[srcStepIndex].substeps[srcSubstepIndex].fields = srcFields;
        } else {
          newSteps[srcStepIndex].fields = srcFields;
        }
        
        // Update destination array
        if (destSubstepIndex !== undefined) {
          newSteps[destStepIndex].substeps[destSubstepIndex].fields = destFields;
        } else {
          newSteps[destStepIndex].fields = destFields;
        }
      }
    }
    // Handle step reordering
    else if (active.data.current.type === 'step' && over.data.current.type === 'step') {
      const sourceIndex = active.data.current.stepIndex;
      const destinationIndex = over.data.current.stepIndex;
      
      if (sourceIndex !== destinationIndex) {
        newFormConfig.steps = arrayMove(
          formConfig.steps,
          sourceIndex,
          destinationIndex
        );
      }
    }
    // Handle substep reordering
    else if (active.data.current.type === 'substep' && over.data.current.type === 'substep') {
      const { stepIndex: srcStepIndex, substepIndex: srcSubstepIndex } = active.data.current;
      const { stepIndex: destStepIndex, substepIndex: destSubstepIndex } = over.data.current;
      
      if (srcStepIndex === destStepIndex && srcSubstepIndex !== destSubstepIndex) {
        // Reorder within the same step
        const step = { ...newSteps[srcStepIndex] };
        step.substeps = arrayMove(step.substeps, srcSubstepIndex, destSubstepIndex);
        newSteps[srcStepIndex] = step;
      } else if (srcStepIndex !== destStepIndex) {
        // Move between steps
        const srcStep = { ...newSteps[srcStepIndex] };
        const destStep = { ...newSteps[destStepIndex] };
        
        const [movedSubstep] = srcStep.substeps.splice(srcSubstepIndex, 1);
        destStep.substeps = [...(destStep.substeps || [])];
        destStep.substeps.splice(destSubstepIndex, 0, movedSubstep);
        
        newSteps[srcStepIndex] = srcStep;
        newSteps[destStepIndex] = destStep;
      }
    }

    newFormConfig.steps = newSteps;
    onChange(newFormConfig);
    
    setActiveId(null);
    setDraggedItem(null);
  };

  const addField = (stepIndex, substepIndex) => {
    const newFormConfig = { ...formConfig };
    const newSteps = [...formConfig.steps];
    
    if (substepIndex !== undefined) {
      // Add field to a substep
      const step = { ...newSteps[stepIndex] };
      const substep = { ...step.substeps[substepIndex] };
      
      const newField = {
        name: `field_${substep.fields.length + 1}`,
        label: 'New Field',
        type: 'text',
        required: false
      };
      
      substep.fields = [...substep.fields, newField];
      step.substeps[substepIndex] = substep;
      newSteps[stepIndex] = step;
    } else {
      // Add field to the main step
      const step = { ...newSteps[stepIndex] };
      
      const newField = {
        name: `field_${step.fields.length + 1}`,
        label: 'New Field',
        type: 'text',
        required: false
      };
      
      step.fields = [...step.fields, newField];
      newSteps[stepIndex] = step;
    }
    
    newFormConfig.steps = newSteps;
    onChange(newFormConfig);
  };

  const removeField = (stepIndex, fieldIndex, substepIndex) => {
    if (window.confirm('Are you sure you want to delete this field?')) {
      const newFormConfig = { ...formConfig };
      const newSteps = [...formConfig.steps];
      
      if (substepIndex !== undefined) {
        // Remove field from a substep
        const step = { ...newSteps[stepIndex] };
        const substep = { ...step.substeps[substepIndex] };
        
        substep.fields = substep.fields.filter((_, index) => index !== fieldIndex);
        step.substeps[substepIndex] = substep;
        newSteps[stepIndex] = step;
      } else {
        // Remove field from the main step
        const step = { ...newSteps[stepIndex] };
        
        step.fields = step.fields.filter((_, index) => index !== fieldIndex);
        newSteps[stepIndex] = step;
      }
    
      newFormConfig.steps = newSteps;
      onChange(newFormConfig);
    }
  };

  const addStep = () => {
    const newFormConfig = { ...formConfig };
    const newSteps = [...formConfig.steps];
    
    const newStep = {
      id: `step_${newSteps.length + 1}`,
      title: 'New Step',
      icon: 'User',
      fields: [],
      substeps: []
    };
    
    newSteps.push(newStep);
    newFormConfig.steps = newSteps;
    onChange(newFormConfig);
  };

  const removeStep = (stepIndex) => {
    if (window.confirm('Are you sure you want to delete this step?')) {
      const newFormConfig = { ...formConfig };
      const newSteps = [...formConfig.steps];
      
      newSteps.splice(stepIndex, 1);
      newFormConfig.steps = newSteps;
      onChange(newFormConfig);
    }
  };

  const duplicateStep = (stepIndex) => {
    const newFormConfig = { ...formConfig };
    const newSteps = [...formConfig.steps];
    
    const originalStep = newSteps[stepIndex];
    const duplicatedStep = {
      ...JSON.parse(JSON.stringify(originalStep)),
      id: `${originalStep.id}_copy_${Date.now()}`,
      title: `${originalStep.title} (Copy)`
    };
    
    newSteps.splice(stepIndex + 1, 0, duplicatedStep);
    newFormConfig.steps = newSteps;
    onChange(newFormConfig);
  };

  const addSubstep = (stepIndex) => {
    const newFormConfig = { ...formConfig };
    const newSteps = [...formConfig.steps];
    const step = { ...newSteps[stepIndex] };
    
    const newSubstep = {
      id: `substep_${step.substeps?.length || 0 + 1}`,
      title: 'New Substep',
      fields: []
    };
    
    step.substeps = [...(step.substeps || []), newSubstep];
    newSteps[stepIndex] = step;
    newFormConfig.steps = newSteps;
    onChange(newFormConfig);
  };

  const removeSubstep = (stepIndex, substepIndex) => {
    if (window.confirm('Are you sure you want to delete this substep?')) {
      const newFormConfig = { ...formConfig };
      const newSteps = [...formConfig.steps];
      const step = { ...newSteps[stepIndex] };
      
      step.substeps = step.substeps.filter((_, index) => index !== substepIndex);
      newSteps[stepIndex] = step;
      newFormConfig.steps = newSteps;
      onChange(newFormConfig);
    }
  };

  const duplicateSubstep = (stepIndex, substepIndex) => {
    const newFormConfig = { ...formConfig };
    const newSteps = [...formConfig.steps];
    const step = { ...newSteps[stepIndex] };
    
    const originalSubstep = step.substeps[substepIndex];
    const duplicatedSubstep = {
      ...JSON.parse(JSON.stringify(originalSubstep)),
      id: `${originalSubstep.id}_copy_${Date.now()}`,
      title: `${originalSubstep.title} (Copy)`
    };
    
    step.substeps.splice(substepIndex + 1, 0, duplicatedSubstep);
    newSteps[stepIndex] = step;
    newFormConfig.steps = newSteps;
    onChange(newFormConfig);
  };

  const handleEditField = (stepIndex, fieldIndex, substepIndex) => {
    let field;
    
    if (substepIndex !== undefined) {
      field = formConfig.steps[stepIndex].substeps[substepIndex].fields[fieldIndex];
    } else {
      field = formConfig.steps[stepIndex].fields[fieldIndex];
    }
    
    setEditingField({ stepIndex, fieldIndex, substepIndex });
    setEditingFieldData(JSON.parse(JSON.stringify(field)));
    setShowFieldDialog(true);
  };

  const handleSaveField = (fieldData) => {
    const { stepIndex, fieldIndex, substepIndex } = editingField;
    
    const newFormConfig = { ...formConfig };
    const newSteps = [...formConfig.steps];
    
    if (substepIndex !== undefined) {
      newSteps[stepIndex].substeps[substepIndex].fields[fieldIndex] = fieldData;
    } else {
      newSteps[stepIndex].fields[fieldIndex] = fieldData;
    }
    
    newFormConfig.steps = newSteps;
    onChange(newFormConfig);
    
    setEditingField(null);
    setEditingFieldData(null);
    setShowFieldDialog(false);
  };

  const handleEditSubstep = (stepIndex, substepIndex) => {
    const substep = formConfig.steps[stepIndex].substeps[substepIndex];
    setEditingSubstep({ stepIndex, substepIndex });
    setEditingSubstepData(JSON.parse(JSON.stringify(substep)));
    setShowSubstepDialog(true);
  };

  const handleSaveSubstep = (substepData) => {
    const { stepIndex, substepIndex } = editingSubstep;
    
    const newFormConfig = { ...formConfig };
    const newSteps = [...formConfig.steps];
    
    newSteps[stepIndex].substeps[substepIndex] = {
      ...newSteps[stepIndex].substeps[substepIndex],
      ...substepData
    };
    
    newFormConfig.steps = newSteps;
    onChange(newFormConfig);
    
    setEditingSubstep(null);
    setEditingSubstepData(null);
    setShowSubstepDialog(false);
  };

  const toggleStepExpansion = (stepIndex) => {
    setExpandedSteps({
      ...expandedSteps,
      [stepIndex]: !expandedSteps[stepIndex]
    });
  };

  const toggleSubstepExpansion = (stepIndex, substepIndex) => {
    const key = `${stepIndex}-${substepIndex}`;
    setExpandedSubsteps({
      ...expandedSubsteps,
      [key]: !expandedSubsteps[key]
    });
  };

  const updateStepIcon = (stepIndex, icon) => {
    const newFormConfig = { ...formConfig };
    const newSteps = [...formConfig.steps];
    
    newSteps[stepIndex] = {
      ...newSteps[stepIndex],
      icon
    };
    
    newFormConfig.steps = newSteps;
    onChange(newFormConfig);
  };

  const updateStepTitle = (stepIndex, title) => {
    const newFormConfig = { ...formConfig };
    const newSteps = [...formConfig.steps];
    
    newSteps[stepIndex] = {
      ...newSteps[stepIndex],
      title
    };
    
    newFormConfig.steps = newSteps;
    onChange(newFormConfig);
  };

  const renderFieldContent = (field, stepIndex, fieldIndex, substepIndex) => {
    return (
      <div className="w-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GripVertical className="text-gray-400" size={16} />
            <span className="font-medium">{field.label || 'Unnamed Field'}</span>
            {field.required && (
              <span className="px-2 py-0.5 text-xs bg-red-50 text-red-600 border border-red-200 rounded-full">
                Required
              </span>
            )}
            <span className="px-2 py-0.5 text-xs bg-blue-50 text-blue-600 border border-blue-200 rounded-full">
              {field.type}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleEditField(stepIndex, fieldIndex, substepIndex)}
              className="p-1 text-blue-500 hover:bg-blue-50 rounded"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => setExpandedField(expandedField === `${stepIndex}-${substepIndex}-${fieldIndex}` ? null : `${stepIndex}-${substepIndex}-${fieldIndex}`)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              {expandedField === `${stepIndex}-${substepIndex}-${fieldIndex}` ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            <button
              onClick={() => removeField(stepIndex, fieldIndex, substepIndex)}
              className="p-1 text-red-500 hover:bg-red-50 rounded"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>

        {expandedField === `${stepIndex}-${substepIndex}-${fieldIndex}` && (
          <div className="mt-4 space-y-4 pl-6 border-l-2 border-gray-200">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-500">Name (ID)</label>
                <p className="text-sm font-mono">{field.name || '-'}</p>
              </div>
              <div>
                <label className="block text-xs text-gray-500">Type</label>
                <p className="text-sm">{field.type || 'text'}</p>
              </div>
            </div>
            
            {field.guidance && (
              <div>
                <label className="block text-xs text-gray-500">Guidance</label>
                <p className="text-sm">{field.guidance}</p>
              </div>
            )}
            
            {field.validation?.rules?.length > 0 && (
              <div>
                <label className="block text-xs text-gray-500">Validation</label>
                <div className="flex flex-wrap gap-1 mt-1">
                  {field.validation.rules.map((rule, i) => (
                    <span key={i} className="px-2 py-0.5 text-xs border border-gray-200 rounded-full">
                      {rule}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {field.options?.length > 0 && (
              <div>
                <label className="block text-xs text-gray-500">Options</label>
                <div className="space-y-1 mt-1">
                  {field.options.map((option, i) => (
                    <div key={i} className="text-sm flex gap-2">
                      <span className="font-mono text-xs">{option.value}:</span>
                      <span>{option.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {/* {field.showIf && (
              <div>
                <label className="block text-xs text-gray-500">Show If</label>
                <p className="text-sm font-mono">{field.showIf}</p>
              </div>
            )} */}
          </div>
        )}
      </div>
    );
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold">Form Structure</h2>
          <button
            onClick={addStep}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            <Plus size={16} /> Add Step
          </button>
        </div>

        <SortableContext
          items={formConfig.steps.map((_, index) => `step-${index}`)}
          strategy={verticalListSortingStrategy}
        >
          {formConfig.steps.map((step, stepIndex) => (
            <SortableStep
              key={`step-${stepIndex}`}
              step={step}
              stepIndex={stepIndex}
            >
              <div key={step.id} className="border border-gray-200 rounded-lg">
                <div className="bg-gray-50 rounded-t-lg border-b border-gray-200">
                  <div className="flex justify-between items-center p-4">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => toggleStepExpansion(stepIndex)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        {expandedSteps[stepIndex] ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                      </button>
                      
                      <div className="flex items-center gap-2">
                        {React.createElement(ICONS[step.icon] || User, { size: 18, className: 'text-blue-500' })}
                        <input
                          type="text"
                          value={step.title}
                          onChange={(e) => updateStepTitle(stepIndex, e.target.value)}
                          className="font-medium text-lg bg-transparent border-none focus:ring-1 focus:ring-blue-500 rounded px-1"
                        />
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <select
                        value={step.icon || 'User'}
                        onChange={(e) => updateStepIcon(stepIndex, e.target.value)}
                        className="p-1 text-xs border rounded"
                      >
                        {Object.keys(ICONS).map(icon => (
                          <option key={icon} value={icon}>{icon}</option>
                        ))}
                      </select>
                      
                      <button
                        onClick={() => addSubstep(stepIndex)}
                        className="p-1 text-blue-500 hover:bg-blue-50 rounded flex items-center gap-1"
                      >
                        <FolderPlus size={16} />
                        <span className="text-xs">Add Substep</span>
                      </button>
                      
                      <button
                        onClick={() => duplicateStep(stepIndex)}
                        className="p-1 text-green-500 hover:bg-green-50 rounded"
                      >
                        <Copy size={16} />
                      </button>
                      
                      <button
                        onClick={() => removeStep(stepIndex)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
                
                {expandedSteps[stepIndex] && (
                  <div className="p-4">
                    {/* Step Fields Section */}
                    <div className="mb-6">
                      <div className="flex justify-between items-center mb-4">
                        <h3 className="font-medium flex items-center gap-2">
                          <List size={16} className="text-blue-500" />
                          Main Fields
                        </h3>
                        <button
                          onClick={() => addField(stepIndex)}
                          className="flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          <Plus size={14} /> Add Field
                        </button>
                      </div>
                      
                      <SortableContext
                        items={step.fields.map((_, fieldIndex) => `${stepIndex}-${fieldIndex}`)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-3">
                          {step.fields.map((field, fieldIndex) => (
                            <SortableField
                              key={`${stepIndex}-${fieldIndex}`}
                              field={field}
                              stepIndex={stepIndex}
                              fieldIndex={fieldIndex}
                            >
                              {renderFieldContent(field, stepIndex, fieldIndex)}
                            </SortableField>
                          ))}
                          
                          {step.fields.length === 0 && (
                            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-500">
                              No fields added yet
                            </div>
                          )}
                        </div>
                      </SortableContext>
                    </div>
                    
                    {/* Substeps Section */}
                    <div className="mt-8">
                      <h3 className="font-medium mb-4 flex items-center gap-2">
                        <Folder size={16} className="text-green-500" />
                        Substeps
                      </h3>
                      
                      <SortableContext
                        items={(step.substeps || []).map((_, substepIndex) => `substep-${stepIndex}-${substepIndex}`)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-4">
                          {(step.substeps || []).map((substep, substepIndex) => (
                            <SortableSubstep
                              key={`substep-${stepIndex}-${substepIndex}`}
                              substep={substep}
                              stepIndex={stepIndex}
                              substepIndex={substepIndex}
                            >
                              <div className="border border-gray-200 rounded-lg bg-white">
                                <div className="px-4 py-3 border-b flex justify-between items-center">
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => toggleSubstepExpansion(stepIndex, substepIndex)}
                                      className="p-1 hover:bg-gray-100 rounded"
                                    >
                                      {expandedSubsteps[`${stepIndex}-${substepIndex}`] ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                                    </button>
                                    <h4 className="font-medium">{substep.title}</h4>
                                  </div>
                                  
                                  <div className="flex items-center gap-1">
                                    <button
                                      onClick={() => handleEditSubstep(stepIndex, substepIndex)}
                                      className="p-1 text-blue-500 hover:bg-blue-50 rounded"
                                    >
                                      <Edit size={14} />
                                    </button>
                                    <button
                                      onClick={() => duplicateSubstep(stepIndex, substepIndex)}
                                      className="p-1 text-green-500 hover:bg-green-50 rounded"
                                    >
                                      <Copy size={14} />
                                    </button>
                                    <button
                                      onClick={() => removeSubstep(stepIndex, substepIndex)}
                                      className="p-1 text-red-500 hover:bg-red-50 rounded"
                                    >
                                      <Trash2 size={14} />
                                    </button>
                                  </div>
                                </div>
                                
                                {expandedSubsteps[`${stepIndex}-${substepIndex}`] && (
                                  <div className="p-4">
                                    <div className="flex justify-between items-center mb-3">
                                      <h5 className="text-sm font-medium text-gray-500">Fields</h5>
                                      <button
                                        onClick={() => addField(stepIndex, substepIndex)}
                                        className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded text-xs hover:bg-green-200"
                                      >
                                        <Plus size={12} /> Add Field
                                      </button>
                                    </div>
                                    
                                    <SortableContext
                                      items={substep.fields.map((_, fieldIndex) => `${stepIndex}-${substepIndex}-${fieldIndex}`)}
                                      strategy={verticalListSortingStrategy}
                                    >
                                      <div className="space-y-3">
                                        {substep.fields.map((field, fieldIndex) => (
                                          <SortableField
                                            key={`${stepIndex}-${substepIndex}-${fieldIndex}`}
                                            field={field}
                                            stepIndex={stepIndex}
                                            substepIndex={substepIndex}
                                            fieldIndex={fieldIndex}
                                          >
                                            {renderFieldContent(field, stepIndex, fieldIndex, substepIndex)}
                                          </SortableField>
                                        ))}
                                        
                                        {substep.fields.length === 0 && (
                                          <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-500 text-sm">
                                            No fields added to this substep yet
                                          </div>
                                        )}
                                      </div>
                                    </SortableContext>
                                  </div>
                                )}
                              </div>
                            </SortableSubstep>
                          ))}
                          
                          {(!step.substeps || step.substeps.length === 0) && (
                            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg text-center text-gray-500">
                              No substeps added yet
                            </div>
                          )}
                        </div>
                      </SortableContext>
                    </div>
                  </div>
                )}
              </div>
            </SortableStep>
          ))}
        </SortableContext>

        <DragOverlay>
          {activeId && draggedItem && (
            <div className="bg-white rounded-lg p-4 border-2 border-blue-500 shadow-lg opacity-80">
              {draggedItem.type === 'field' && (
                <div className="flex items-center gap-2">
                  <GripVertical className="text-gray-400" size={16} />
                  <span className="font-medium">
                    {draggedItem.field?.label || 'Unnamed Field'}
                  </span>
                </div>
              )}
              {draggedItem.type === 'step' && (
                <div className="flex items-center gap-2">
                  <GripVertical className="text-blue-400" size={16} />
                  <span className="font-medium">
                    {draggedItem.step?.title || 'Unnamed Step'}
                  </span>
                </div>
              )}
              {draggedItem.type === 'substep' && (
                <div className="flex items-center gap-2">
                  <GripVertical className="text-green-400" size={16} />
                  <span className="font-medium">
                    {draggedItem.substep?.title || 'Unnamed Substep'}
                  </span>
                </div>
              )}
            </div>
          )}
        </DragOverlay>
      </div>
      
      {/* Field Editor Modal */}
      {showFieldDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-auto">
            <div className="p-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold">Edit Field</h2>
                <p className="text-sm text-gray-500">Configure the properties for this field</p>
              </div>
              
              <FieldPropertiesEditor
                field={editingFieldData}
                onSave={handleSaveField}
                onCancel={() => setShowFieldDialog(false)}
              />
            </div>
          </div>
        </div>
      )}
      
      {/* Substep Editor Modal */}
      {showSubstepDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg shadow-lg w-full max-w-lg">
            <div className="p-6">
              <div className="mb-4">
                <h2 className="text-xl font-semibold">Edit Substep</h2>
                <p className="text-sm text-gray-500">Configure the properties for this substep</p>
              </div>
              
              <SubstepEditor
                substep={editingSubstepData}
                stepIndex={editingSubstep?.stepIndex}
                substepIndex={editingSubstep?.substepIndex}
                onSave={handleSaveSubstep}
                onCancel={() => setShowSubstepDialog(false)}
              />
            </div>
          </div>
        </div>
      )}
    </DndContext>
  );
};

// Main Form Editor Component
const FormEditor = () => {
  const [formData, setFormData] = useState(initialState);
  const [activeTab, setActiveTab] = useState('editor');
  const [activeSection, setActiveSection] = useState('form');
  const [saveStatus, setSaveStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [secretCode, setSecretCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [lockTimer, setLockTimer] = useState(0);
  const CORRECT_SECRET_CODE = 'LegalAccess2025';
  const MAX_ATTEMPTS = 5;
  const LOCK_TIME = 60; // Seconds
  const STORAGE_KEY = 'formEditorAuthenticated';
  
  const loadOriginalEligibilityJson = async () => {
    try {
      setIsLoading(true);
      // Dynamic import of the original eligibility JSON
      const eligibilityJson = await import('../lib/formConfig.json');
      return eligibilityJson.default;
    } catch (error) {
      console.error('Error loading original eligibility JSON:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  //Returns the form to the last known entry
  const restoreLastSaveSimple = async () => {
    if (window.confirm('Are you sure you want to reset to the previous form configuration?')) {
      try {
        setSaveStatus('Resetting...');
        
        // Load the original JSON file
        const response = await fetch('/api/eligibility')
        //Gets collection
        if (!response.ok) {
          // If API fails, use initial state
          console.warn('Failed to load form data, using initial state');
          setFormData(initialState);
          return;
        }

        const data = await response.json()
        setFormData(data[0]);
        
        // Reset form data
        
        setSaveStatus('Reset complete!');
        setTimeout(() => setSaveStatus(''), 3000);
      } catch (error) {
        console.error('Failed to reset eligibility form:', error);
        setSaveStatus('Reset failed');
        setTimeout(() => setSaveStatus(''), 3000);
      }
    }
  };
  
  const resetEligibilitySimple = async () => {
    if (window.confirm('Are you sure you want to reset to the original form configuration?')) {
      try {
        setSaveStatus('Resetting...');
        
        // Load the original JSON file
        const eligibilityJson = await import('../lib/formConfig.json');
        
        // Reset form data
        setFormData(eligibilityJson.default);
        
        setSaveStatus('Reset complete!');
        setTimeout(() => setSaveStatus(''), 3000);
      } catch (error) {
        console.error('Failed to reset eligibility form:', error);
        setSaveStatus('Reset failed');
        setTimeout(() => setSaveStatus(''), 3000);
      }
    }
  };
  
  // Handle save
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
  
  // Update form metadata when saving
  const updateFormMetadata = () => {
    const newFormData = { ...formData };
    newFormData.formConfig.metadata.lastUpdated = new Date().toISOString();
    newFormData.formConfig.metadata.version = incrementVersion(newFormData.formConfig.metadata.version);
    setFormData(newFormData);
  };
  
  // Helper to increment version number
  const incrementVersion = (version) => {
    const parts = version.split('.');
    const lastPart = parseInt(parts[parts.length - 1]) + 1;
    parts[parts.length - 1] = lastPart.toString();
    return parts.join('.');
  };
  
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

  // Load data only when authenticated
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setLoadError(null);
        
        // Try to fetch data from API
        const response = await fetch('api/eligibility');
        
        if (!response.ok) {
          // If API fails, use initial state
          console.warn('Failed to load form data, using initial state');
          setFormData(initialState);
          return;
        }

       const data = await response.json()
        setFormData(data[data.length-1]);

      } catch (error) {
        console.error('Error loading form data:', error);
        setLoadError('Failed to load form data');
        // Fallback to initial state if API fails
        setFormData(initialState);
      } finally {
        setIsLoading(false);
      }
    };

    // Only load data if authenticated
    if (isAuthenticated) {
      loadData();
    }
  }, [isAuthenticated]);

  // Handle form submission
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
  
  // Helper function to get counts of elements
  const getFormStats = () => {
    let totalSteps = formData.formConfig.steps.length;
    let totalSubsteps = 0;
    let totalFields = 0;
    
    formData.formConfig.steps.forEach(step => {
      totalFields += step.fields.length;
      if (step.substeps) {
        totalSubsteps += step.substeps.length;
        step.substeps.forEach(substep => {
          totalFields += substep.fields.length;
        });
      }
    });
    
    return { totalSteps, totalSubsteps, totalFields };
  };
  
  // Show loading state if authenticated but still loading
  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading form configuration...</p>
        </div>
      </div>
    );
  }

  // Show error state if authenticated but error loading
  if (loadError) {
    return (
      <div className="max-w-6xl mx-auto p-6">
        <Alert variant="destructive">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {loadError}. Using default configuration.
            </AlertDescription>
          </div>
        </Alert>
      </div>
    );
  }
  
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
            <div className="mb-4 p-4 rounded-md bg-red-50 text-red-700 border border-red-300">
              {error}
            </div>
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

  // Main authenticated view
  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8 bg-white rounded-lg shadow-sm p-4">
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-semibold text-gray-800">
                {formData.formConfig.metadata.clinic.name} Builder
              </h1>
              <span className="ml-2 px-2 py-0.5 text-xs bg-blue-100 text-blue-800 border border-blue-200 rounded-full">
                v{formData.formConfig.metadata.version}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-3 py-1.5 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                <Lock size={14} /> Logout
              </button>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('editor')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  activeTab === 'editor' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <Settings size={16} /> Editor
              </button>
              <button
                onClick={() => setActiveTab('preview')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  activeTab === 'preview' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                <EyeIcon size={16} /> Preview
              </button>
            </div>
            
            <div className="flex items-center gap-3">
              <Tooltip text="Form structure statistics">
                <div className="flex gap-2 px-3 py-1.5 bg-gray-100 text-gray-700 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-1.5">
                    <Layers size={14} className="text-blue-500" />
                    <span className="text-sm">{getFormStats().totalSteps} Steps</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Folder size={14} className="text-green-500" />
                    <span className="text-sm">{getFormStats().totalSubsteps} Substeps</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Square size={14} className="text-purple-500" />
                    <span className="text-sm">{getFormStats().totalFields} Fields</span>
                  </div>
                </div>
              </Tooltip>
              
              <button
                onClick={resetEligibilitySimple}
                disabled={isLoading}
                className="flex items-center gap-2 px-2 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCcw size={14} className="animate-spin" /> Loading...
                  </>
                ) : (
                  <>
                    <RefreshCcw size={14} /> Reset to Original
                  </>
                )}
              </button>

              {/* <button
                onClick={restoreLastSaveSimple}
                disabled={isLoading}
                className="flex items-center gap-2 px-2 py-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <RefreshCcw size={14} className="animate-spin" /> Loading...
                  </>
                ) : (
                  <>
                    <RefreshCcw size={14} /> Restore Last Save
                  </>
                )}
              </button>
               */}
              <span className={`text-sm ${
                saveStatus.includes('Error') ? 'text-red-500' : 'text-green-500'
              }`}>
                {saveStatus}
              </span>
              
              <button
                onClick={() => {
                  updateFormMetadata();
                  handleSave();
                }}
                className="flex items-center gap-2 px-2 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                <Save size={14} /> Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {activeTab === 'editor' ? (
        <div className="space-y-8">
          <div className="tabs-container" data-value={activeSection}>
            <div className="flex space-x-1 border-b mb-4">
              <button
                className={`px-4 py-2 font-medium ${activeSection === 'form' 
                  ? 'border-b-2 border-blue-500 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
                onClick={() => setActiveSection('form')}
              >
                <div className="flex gap-2 items-center">
                  <Layers size={16} /> Form Structure
                </div>
              </button>
              <button
                className={`px-4 py-2 font-medium ${activeSection === 'constants' 
                  ? 'border-b-2 border-blue-500 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
                onClick={() => setActiveSection('constants')}
              >
                <div className="flex gap-2 items-center">
                  <Settings size={16} /> Constants
                </div>
              </button>
              <button
                className={`px-4 py-2 font-medium ${activeSection === 'thresholds' 
                  ? 'border-b-2 border-blue-500 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
                onClick={() => setActiveSection('thresholds')}
              >
                <div className="flex gap-2 items-center">
                  <DollarSign size={16} /> Thresholds
                </div>
              </button>
              <button
                className={`px-4 py-2 font-medium ${activeSection === 'resources' 
                  ? 'border-b-2 border-blue-500 text-blue-700' 
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'}`}
                onClick={() => setActiveSection('resources')}
              >
                <div className="flex gap-2 items-center">
                  <FileText size={16} /> Resources
                </div>
              </button>
            </div>
            
            <div className="bg-white border border-gray-200 rounded-lg shadow-sm border-t-0 rounded-t-none">
              <div className="p-6">
                {activeSection === 'form' && (
                  <FormStepsEditor 
                    formConfig={formData.formConfig} 
                    onChange={(newConfig) => setFormData({ ...formData, formConfig: newConfig })}
                  />
                )}
                
                {activeSection === 'constants' && (
                  <ConstantsEditor 
                    constants={formData.CONSTANTS}
                    onChange={(newConstants) => setFormData({ ...formData, CONSTANTS: newConstants })}
                  />
                )}
                
                {activeSection === 'thresholds' && (
                  <ThresholdsEditor 
                    thresholds={formData.MONTHLY_THRESHOLDS}
                    onChange={(newThresholds) => setFormData({ ...formData, MONTHLY_THRESHOLDS: newThresholds })}
                  />
                )}
                
                {activeSection === 'resources' && (
                  <ResourcesEditor 
                    resources={formData.RESOURCES}
                    onChange={(newResources) => setFormData({ ...formData, RESOURCES: newResources })}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
          <div className="bg-gray-50 border-b p-4">
            <h3 className="text-lg font-semibold">Form Preview</h3>
          </div>
          <div className="p-0">
            <FormPreview formData={formData} />
          </div>
        </div>
      )}
    </div>
  );
};

// Export the component
export default FormEditor;