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
  Info, 
  BookOpen,
  User,
  House,
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

// Icon mapping for categories
const ICONS = {
  User,
  Shield,
  House,
  BookOpen,
  Phone,
  Info,
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
    name: step.id,
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

// Main Form Editor Component
const FormEditor = () => {
  const initialFormState = {
    steps: [
      {
        name: "First Nations",
        icon: "Info",
        fields: []
      },
      {
        name: "Rehabilitation",
        icon: "BookOpen",
        fields: []
      },
      {
        name: "Shelters",
        icon: "House",
        fields: []
      },
      {
        name: "Legal And Referral Services",
        icon: "Scale",
        fields: []
      }
    ]
  };

  // Form editor state
  const [formData, setFormData] = useState(initialFormState);
  const [activeStep, setActiveStep] = useState(0);
  const [expandedField, setExpandedField] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');
  const [isInitialized, setIsInitialized] = useState(false);
  const [activeId, setActiveId] = useState(null);
  const [activeField, setActiveField] = useState(null);
  const [draggedItemType, setDraggedItemType] = useState(null);
  const [draggedItem, setDraggedItem] = useState(null);
  const resetSimple = async () => {
    if (window.confirm('Are you sure you want to reset the form to the original configuration? All changes will be lost.')) {
      try {
        setSaveStatus('Resetting...');
        
        // Load the original JSON file
        const dummyJson = await import('./api/dummy.json');
        
        // Reset only the form data
        setFormData(dummyJson.default);
        
        setSaveStatus('Reset complete!');
        setTimeout(() => setSaveStatus(''), 3000);
      } catch (error) {
        console.error('Failed to reset form:', error);
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
  const CORRECT_SECRET_CODE = 'LegalAccess2025resources'; // Your secret code
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

  const resetEligibilitySimple = async () => {
    if (window.confirm('Are you sure you want to reset to the original form configuration?')) {
      try {
        setSaveStatus('Resetting...');
        
        // Load the original JSON file
        const originalJSON = await import('./api/dummy.json');
        
        // Reset form data
        setFormData(originalJSON.default);
        
        setSaveStatus('Reset complete!');
        setTimeout(() => setSaveStatus(''), 3000);
      } catch (error) {
        console.error('Failed to reset eligibility form:', error);
        setSaveStatus('Reset failed');
        setTimeout(() => setSaveStatus(''), 3000);
      }
    }
  };

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
  // const handleDragStart = (event) => {
  //   const { active } = event;
  //   setActiveId(active.id);
    
  //   if (active.data?.current) {
  //     setDraggedItem(active.data.current);
  //   }
  // };
   const handleDragStart = (event) => {
    const { active } = event;
    setDraggedItemType(active.data?.current?.type);
    setDraggedItem(active.data?.current?.field || active.data?.current?.step);
  };

  // Handle drag end
  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over || active.name === over.name) {
      setDraggedItemType(null);
      setDraggedItem(null);
      return;
    }

    setFormData((formData) => {
      if (active.data.current.type === 'field') {
        // Handle field reordering
        const [sourceStepIndex, sourceFieldIndex] = active.name.split('-').map(Number);
        const [targetStepIndex, targetFieldIndex] = over.name.split('-').map(Number);
        
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
        const oldIndex = formData.steps.findIndex((step) => step.name === active.name);
        const newIndex = formData.steps.findIndex((step) => step.name === over.name);
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
        name: `category_${prev.steps.length + 1}`,
        icon: "User",
        fields: []
      }]
    }));
  };

  const removeStep = (stepIndex) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
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
        [field]: value,
        fields: newSteps[stepIndex].fields.map(f => ({
          ...f,
          category: value, 
        })),
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
            name: `entry_${newSteps[stepIndex].fields.length + 1}`,
            category: `${newSteps[stepIndex].name}`,
          }
        ]
      };
      return { ...prev, steps: newSteps };
    });
  };

  const removeField = (stepIndex, fieldIndex) => {
    if (window.confirm('Are you sure you want to delete this entry?')) {
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
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 mr-4"
            >
                <Lock size={16} /> Logout
            </button>
            <button
                onClick={resetSimple}
                className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
            >
                <RefreshCcw size={16} /> Reset Form
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
        </div>
      </div>
  
      {/* Main Content Area */}
        <div className="space-y-8">
          
          {/* Steps Section */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Categories</h2>
              <button
                onClick={addStep}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg shadow-sm hover:bg-blue-600 transition-colors"
              >
                <Plus size={16} /> Add Category
              </button>
            </div>
  
            {formData.steps.map((step, stepIndex) => (
              <Card key={step.name} className="mb-4">
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
                        value={step.name}
                        onChange={(e) => handleStepChange(stepIndex, 'name', e.target.value)}
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
                      <h3 className="text-sm font-medium text-gray-700">Entries</h3>
                      <button
                        onClick={() => addField(stepIndex)}
                        className="flex items-center gap-2 px-3 py-1 text-blue-500 hover:bg-blue-50 rounded-md transition-colors"
                      >
                        <Plus size={14} /> Add Entry
                      </button>
                    </div>
  
                    <DndContext
                      sensors={sensors}
                      collisionDetection={closestCenter}
                      onDragStart={handleDragStart}
                      onDragEnd={(event) => {
                        const { active, over } = event;
                        if (!over || active.name === over.name) return;
  
                        setFormData(prev => {
                          const newSteps = [...prev.steps];
                          const step = newSteps[stepIndex];
                          const activeIndex = parseInt(active.name);
                          const overIndex = parseInt(over.name);
                          
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
                                  <span className="font-medium text-gray-700">{field.name || 'Unnamed Field'}</span>
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
                                        <label className="block text-sm font-medium mb-1">Name</label>
                                        <input
                                          type="text"
                                          value={field.name || ''}
                                          onChange={(e) => handleFieldChange(stepIndex, fieldIndex, 'name', e.target.value)}
                                          className="w-full p-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                      </div>
                                      <div>
                                        <label className="block text-sm font-medium mb-1">Email</label>
                                        <input
                                          type="text"
                                          value={field.email || ''}
                                          onChange={(e) => handleFieldChange(stepIndex, fieldIndex, 'email', e.target.value)}
                                          className="w-full p-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                      </div>
                                    </div>
  
                                    <div className="grid grid-cols-2 gap-4">
                                      <div>
                                        <label className="block text-sm font-medium mb-1">Location</label>
                                        <input
                                          type="text"
                                          value={field.location || ''}
                                          onChange={(e) => handleFieldChange(stepIndex, fieldIndex, 'location', e.target.value)}
                                          className="w-full p-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                      </div>
  
                                        <div>
                                          <label className="block text-sm font-medium mb-1">Phone Number</label>
                                          <input
                                            type="text"
                                            value={field.phoneNumber || ''}
                                            onChange={(e) => handleFieldChange(stepIndex, fieldIndex, 'phoneNumber', e.target.value)}
                                            className="w-full p-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                          />
                                        </div>
                                      </div>
                                  
                                  <div className="grid grid-cols-1 gap-4">
                                      <div>
                                        <label className="block text-sm font-medium mb-1">Website</label>
                                        <input
                                          type="text"
                                          value={field.website || ''}
                                          onChange={(e) => handleFieldChange(stepIndex, fieldIndex, 'website', e.target.value)}
                                          className="w-full p-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        />
                                      </div>
                                    </div>

                                  <div>
                                    <label className="block text-sm font-medium mb-1">Description</label>
                                    <input
                                      type="textarea"
                                      value={field.description || ''}
                                      onChange={(e) => handleFieldChange(stepIndex, fieldIndex, 'description', e.target.value)}
                                      className="w-full p-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      placeholder=""
                                    />
                                  </div>

                                  <div>
                                    <label className="block text-sm font-medium mb-1">Notes</label>
                                    <input
                                      type="text"
                                      value={field.notes || ''}
                                      onChange={(e) => handleFieldChange(stepIndex, fieldIndex, 'notes', e.target.value)}
                                      className="w-full p-2 border rounded-md shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                      placeholder="Women only, Wheelchair-accessible, Faith-based, Bilingual Services..."
                                    />
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
                            <GripVertical className="text-gray-600" size={16} />
                            <span className="font-medium">
                              {step.fields[parseInt(activeId)]?.name || 'Unnamed Field'}
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
  </div>
);
};

export default FormEditor;