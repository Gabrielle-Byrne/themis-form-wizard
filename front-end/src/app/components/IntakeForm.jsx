import React, { useState, useEffect } from 'react';
import clsx from 'clsx';
import {
  AlertCircle, Shield, User, Phone, Home, DollarSign,
  Scale, ChevronRight, ChevronLeft, Info, Check, Send,
  FileText, CheckCircle, RefreshCcw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { submitFormWithOutFiles } from '../lib/api';
// Resource definitions
import configData from '../intake-editor-legal-clinic-unb/api/dummy.json';

const RESOURCES = {
  Shelters: [
    {
      name: "Oak Centre",
      location: "Fredericton",
      phoneNumber: "(506) 206-0667",
      category: "Shelters"
    },
    {
      name: "Saint John House",
      location: "Fredericton",
      phoneNumber: "(506) 450-1102",
      category: "Shelters"
    },
    {
      name: "Women in Transition",
      location: "Fredericton",
      phoneNumber: "(506) 459-2300",
      notes: "Women Only",
      category: "Shelters"
    },
    {
      name: "Grace House for Women",
      phoneNumber: "(506) 450-3001",
      notes: "Women Only",
      category: "Shelters"
    },
    {
      name: "Gignoo Transition House",
      phoneNumber: "(800) 565-6878",
      notes: "First Nations Women",
      category: "Shelters"
    }
  ],
  legal: [
    {
      name: "Legal Aid New Brunswick",
      phoneNumber: "(506) 444-2777",
      category: "legal"
    },
    {
      name: "Law Society of New Brunswick",
      phoneNumber: "(506) 458-8540",
      category: "legal"
    }
  ],
  emergency: [
    {
      name: "Emergency Services",
      phoneNumber: "911",
      category: "emergency",
      description: "For immediate danger"
    },
    {
      name: "Mental Health Crisis Line",
      phoneNumber: "1-800-667-5005",
      category: "emergency",
      description: "24/7 crisis support"
    }
  ]
};

export default function IntakeForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [progress, setProgress] = useState(0);
  const [visitedSteps, setVisitedSteps] = useState(new Set([0]));
  const [activeResources, setActiveResources] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({ loading: false, error: null });
  const [showSuccess, setShowSuccess] = useState(false);
  const [submissionId, setSubmissionId] = useState(null);
  const [ formConfig , setConfig] = useState(configData);
  
    useEffect(() => {
      async function fetchIntakeData() {
        try {
          const res = await fetch('/api/intake');
          const data = await res.json();
          if (!res.ok) {
            throw new Error(`Error fetching data: ${data.message || 'Unknown error'}`);
          }
          const formData = data[data.length-1];
          setConfig({...formData.formConfig});
        } catch (error) {
          console.error('Failed to fetch intake data:', error);
        }
      }
  
      fetchIntakeData()
    }, [ ]);

  const resetForm = () => {
    setFormData({});
    setErrors({});
    setCurrentStep(0);
    setVisitedSteps(new Set([0]));
    setSubmitStatus({ loading: false, error: null });
    setShowSuccess(false);
    setSubmissionId(null);
    setActiveResources(null);
    setSubmitted(false);
  };
  
  useEffect(() => {
    const newProgress = ((currentStep + 1) / formConfig.steps.length) * 100;
    setProgress(newProgress);
  }, [currentStep]);

  const validateField = (field, value, allData = formData) => {
    if (field.required && (!value || value === '')) {
      return {
        isValid: false,
        message: `${field.label} is required`
      };
    }

    switch (field.name) {
      case 'dateOfBirth':
        if (!value) return { isValid: false, message: 'Date of birth is required' };

        const dob = new Date(value);
        const today = new Date();
        let age = today.getFullYear() - dob.getFullYear();
        const monthDiff = today.getMonth() - dob.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
          age--;
        }

        if (age < 18) {
          return {
            isValid: false,
            message: 'You must be at least 18 years old'
          };
        }

        return { isValid: true };

      case 'email':
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return {
          isValid: emailRegex.test(value),
          message: emailRegex.test(value) ? '' : 'Please enter a valid email address'
        };

      case 'phone':
        const phoneRegex = /^\(?([0-9]{3})\)?[-. ]?([0-9]{3})[-. ]?([0-9]{4})$/;
        return {
          isValid: phoneRegex.test(value),
          message: phoneRegex.test(value) ? '' : 'Please enter a valid phone number'
        };

      case 'monthlyIncome':
      case 'monthlyExpenses':
        const numValue = parseFloat(value);
        return {
          isValid: !isNaN(numValue) && numValue >= 0,
          message: !isNaN(numValue) && numValue >= 0 ? '' : 'Please enter a valid amount'
        };

      default:
        return { isValid: true };
    }
  };
  
  const filterResourcesByCategory = (resources, category, criteria = {}) => {
    return resources
      .filter(resource => resource.category === category)
      .filter(resource => {
        if (criteria.gender) {
          if (resource.notes?.toLowerCase().includes(`${criteria.gender} only`)) {
            return true;
          }
        }
        if (criteria.isFirstNations && resource.notes?.toLowerCase().includes('first nations')) {
          return true;
        }
        return !resource.notes ||
          (!resource.notes.toLowerCase().includes('only') &&
            !resource.notes.toLowerCase().includes('first nations'));
      });
  };
  
  const getRelevantResources = (issueType, userData) => {
    let relevantResources = [];

    // Base legal resources for most issues
    if (issueType !== 'notary') {
      relevantResources = [...RESOURCES.legal];
    }

    // Add category-specific resources
    switch (issueType) {
      case 'housing':
        const shelterResources = filterResourcesByCategory(
          RESOURCES.Shelters,
          'Shelters',
          {
            gender: userData.gender,
            isFirstNations: userData.isFirstNations
          }
        );
        relevantResources = [...relevantResources, ...shelterResources];
        break;

      case 'benefits':
      case 'employment':
      case 'human-rights':
        // Add mental health support for potentially stressful cases
        relevantResources = [
          ...relevantResources,
          RESOURCES.emergency.find(r => r.name === "Mental Health Crisis Line")
        ].filter(Boolean);
        break;

      case 'immigration':
        // Immigration cases might need comprehensive support
        const immigrationResources = [
          ...relevantResources,
          RESOURCES.emergency.find(r => r.name === "Mental Health Crisis Line"),
          ...filterResourcesByCategory(RESOURCES.Shelters, 'Shelters', {
            isFirstNations: userData.isFirstNations
          })
        ].filter(Boolean);
        relevantResources = immigrationResources;
        break;

      case 'divorce':
        // Domestic cases might need shelter and crisis support
        relevantResources = [
          ...relevantResources,
          ...filterResourcesByCategory(RESOURCES.Shelters, 'Shelters', {
            gender: userData.gender
          }),
          RESOURCES.emergency.find(r => r.name === "Mental Health Crisis Line")
        ].filter(Boolean);
        break;

      case 'offences':
        // Only specific legal aid for provincial offences
        relevantResources = [RESOURCES.legal.find(r => r.name === "Legal Aid New Brunswick")].filter(Boolean);
        break;

      case 'small-claims':
      case 'notary':
        // Law Society for small claims and notary
        relevantResources = [RESOURCES.legal.find(r => r.name === "Law Society of New Brunswick")].filter(Boolean);
        break;
    }

    // Remove duplicates
    return Array.from(new Set(relevantResources.map(r => JSON.stringify(r))))
      .map(str => JSON.parse(str));
  };
  
  const handleFieldChange = (name, value) => {
    const newData = { ...formData, [name]: value };
    setFormData(newData);

    // Clear error when field is modified
    if (errors[name]) {
      const newErrors = { ...errors };
      delete newErrors[name];
      setErrors(newErrors);
    }

    // Find the current field
    const field = formConfig.steps[currentStep].fields.find(f => f.name === name);

    // Resource suggestion logic based on field changes
    let updatedResources = [];

    // Handle legal issue type changes
    if (name === 'legalIssueType') {
      updatedResources = getRelevantResources(value, formData);
    }

    // Handle emergency/safety concerns
    if (name === 'safetyRisk' && value === 'yes') {
      updatedResources = [
        ...RESOURCES.emergency,
        ...filterResourcesByCategory(RESOURCES.Shelters, 'Shelters', {
          gender: formData.gender,
          isFirstNations: formData.isFirstNations
        })
      ];
    }

    // Handle housing needs
    if (name === 'needsHousing' && value === 'yes') {
      const shelterResources = filterResourcesByCategory(
        RESOURCES.Shelters,
        'Shelters',
        {
          gender: formData.gender,
          isFirstNations: formData.isFirstNations
        }
      );
      updatedResources = [
        ...(activeResources || []),
        ...shelterResources
      ];
    }

    // Add mental health resources for specific stress indicators
    if (['stressLevel', 'mentalHealth'].includes(name) &&
      (value === 'high' || value === 'yes')) {
      const mentalHealthResource = RESOURCES.emergency.find(
        r => r.name === "Mental Health Crisis Line"
      );
      if (mentalHealthResource) {
        updatedResources = [
          ...(activeResources || []),
          mentalHealthResource
        ];
      }
    }

    // Update active resources with deduplication
    if (updatedResources.length > 0) {
      const uniqueResources = Array.from(
        new Set(updatedResources.map(r => JSON.stringify(r)))
      ).map(str => JSON.parse(str));

      // Sort resources by category
      const sortedResources = uniqueResources.sort((a, b) => {
        const categoryOrder = {
          emergency: 1,
          Shelters: 2,
          legal: 3
        };
        return (categoryOrder[a.category] || 99) - (categoryOrder[b.category] || 99);
      });

      setActiveResources(sortedResources);
    }

    // Field validation
    if (field) {
      const validation = validateField(field, value, newData);
      if (!validation.isValid) {
        setErrors(prev => ({
          ...prev,
          [name]: validation.message
        }));
      }
    }
  };

  const validateStep = (stepIndex) => {
    const step = formConfig.steps[stepIndex];
    const newErrors = {};
    let isValid = true;

    for (const field of step.fields) {
      // if (field.showIf) {
      //   const [dependentField, expectedValue] = field.showIf.split(' === ');
      //   if (formData[dependentField] !== expectedValue.replace(/['"]/g, '')) {
      //     continue;
      //   }
      // }

      const validation = validateField(field, formData[field.name]);
      if (!validation.isValid) {
        newErrors[field.name] = validation.message;
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      if (currentStep === formConfig.steps.length - 1) {
        handleSubmit();
      } else {
        const nextStep = currentStep + 1;
        setCurrentStep(nextStep);
        setVisitedSteps(prev => new Set([...prev, nextStep]));
      }
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const handleStepClick = (index) => {
    if (visitedSteps.has(index) || (index === currentStep + 1 && validateStep(currentStep))) {
      setCurrentStep(index);
      setVisitedSteps(prev => new Set([...prev, index]));
    }
  };

  const handleSubmit = async () => {
    if (validateStep(currentStep)) {
      // console.log('Form submitted:', formData);
      setSubmitStatus({ loading: true, error: null });
      try {
        const response = await submitFormWithOutFiles(formData);
        setSubmitStatus({ loading: true, error: null });

        setSubmissionId(response.submissionId);
        setShowSuccess(true);
        // Optional: Reset form or redirect
        setSubmitted(true);
      } catch (error) {
        setSubmitStatus({
          loading: false,
          error: 'Failed to submit form. Please try again.'
        });
        alert("contact admin")
        // console.log(error)
        setSubmitted(false)
      }
    }
  };

  const renderField = (field) => {
    // Check if field should be shown based on dependencies
    // if (field.showIf) {
    //   const [dependentField, expectedValue] = field.showIf.split(' === ');
    //   if (formData[dependentField] !== expectedValue.replace(/['"]/g, '')) {
    //     return null;
    //   }
    // }

    const hasError = errors[field.name];

    switch (field.type) {
      case 'radio':
        return (
          <div className="space-y-3">
            <RadioGroup
              value={formData[field.name] || ''}
              onValueChange={(value) => handleFieldChange(field.name, value)}
            >
              {field.options.map(option => (
                <div
                  key={option.value}
                  className={`
                    flex items-center p-4 rounded-lg border cursor-pointer
                    transition-all duration-200 hover:shadow-md
                    ${formData[field.name] === option.value
                      ? 'border-blue-500 bg-blue-50 shadow-sm'
                      : 'border-gray-200 hover:border-blue-200 hover:bg-gray-50'}
                  `}
                >
                  <RadioGroupItem value={option.value} id={`${field.name}-${option.value}`} className="text-blue-600" />
                  <Label 
                    htmlFor={`${field.name}-${option.value}`} 
                    className="ml-3 font-medium text-gray-800 text-sm sm:text-base"
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
            {hasError && (
              <Alert variant="destructive" className="bg-red-50 border-red-200 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-medium text-sm">{hasError}</AlertDescription>
              </Alert>
            )}
          </div>
        );

      case 'select':
        return (
          <div>
            <Select
              value={formData[field.name] || ''}
              onValueChange={(value) => handleFieldChange(field.name, value)}
            >
              <SelectTrigger className={`w-full ${hasError ? 'border-red-500 ring-1 ring-red-200' : 'focus:ring-blue-200 focus:border-blue-500'}`}>
                <SelectValue placeholder="Select an option" className="text-gray-600" />
              </SelectTrigger>
              <SelectContent className="bg-white shadow-xl border-gray-200">
                {field.options.map(option => (
                  <SelectItem key={option.value} value={option.value} className="focus:bg-blue-50 focus:text-blue-800">
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {hasError && (
              <Alert variant="destructive" className="mt-2 bg-red-50 border-red-200 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-medium text-sm">{hasError}</AlertDescription>
              </Alert>
            )}
          </div>
        );

      case 'textarea':
        return (
          <div>
            <Textarea
              value={formData[field.name] || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className={`min-h-[120px] transition-all border-gray-300 focus:border-blue-500 focus:ring-blue-200 ${
                hasError ? 'border-red-500 ring-1 ring-red-200' : ''
              }`}
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()} here...`}
            />
            {hasError && (
              <Alert variant="destructive" className="mt-2 bg-red-50 border-red-200 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-medium text-sm">{hasError}</AlertDescription>
              </Alert>
            )}
          </div>
        );

      default:
        return (
          <div>
            <Input
              type={field.type}
              value={formData[field.name] || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className={`transition-all border-gray-300 focus:border-blue-500 focus:ring-blue-200 ${
                hasError ? 'border-red-500 ring-1 ring-red-200' : ''
              }`}
              placeholder={field.placeholder || `Enter ${field.label.toLowerCase()} here...`}
            />
            {hasError && (
              <Alert variant="destructive" className="mt-2 bg-red-50 border-red-200 text-red-700">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="font-medium text-sm">{hasError}</AlertDescription>
              </Alert>
            )}
          </div>
        );
    }
  };

  if (submitted) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 px-4">
        <div className="bg-white rounded-xl p-8 max-w-md w-full mx-auto shadow-2xl transition-all duration-300 animate-fadeIn">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-green-50">
              <CheckCircle className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
              Application Submitted Successfully
            </h2>
            <p className="text-gray-600 mb-2 text-base">
              Your application has been received.
            </p>
            <p className="bg-gray-100 py-2 px-4 rounded-lg inline-block text-gray-700 font-mono mb-6">
              Reference ID: {submissionId}
            </p>
            
            <div className="mt-6 space-y-3">
              <button
                onClick={() => {
                  // Add navigation logic here if needed
                  window.location.href = '/thank-you';
                }}
                className="w-full px-6 py-3 text-base font-medium text-white bg-blue-600 
                  rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
              >
                Continue to Thank You Page
              </button>
              <button
                onClick={() => {
                  resetForm();
                  setShowSuccess(false);
                }}
                className="w-full px-6 py-3 text-base font-medium text-gray-700 bg-gray-100 
                  rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
              >
                <RefreshCcw className="w-5 h-5" />
                Submit Another Application
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const currentStepConfig = formConfig.steps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-b px-4 py-6 md:py-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Card className="mb-8 overflow-hidden shadow-md border-0">
        <div className="h-1 bg-gradient-to-r from-blue-600 via-blue-500 to-red-500 w-full"></div>
          <CardHeader className="pb-4 pt-6">
            <CardTitle className="text-2xl md:text-3xl text-center font-bold text-blue-800">
              {formConfig.metadata.clinic.name}
            </CardTitle>
            <CardDescription className="text-center text-sm md:text-base text-gray-600 mt-2 space-x-2">
              <span className="inline-flex items-center"><Phone className="w-4 h-4 mr-1" /> {formConfig.metadata.clinic.phone}</span> • 
              <span className="inline-flex items-center"><Info className="w-4 h-4 mr-1" /> {formConfig.metadata.clinic.email}</span> • 
              <span className="inline-flex items-center"><Home className="w-4 h-4 mr-1" /> {formConfig.metadata.clinic.address}</span>
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="max-w-3xl mx-auto">
            <Progress value={progress} className="h-2 mb-6 bg-gray-200">
              <div 
                className="h-full bg-blue-600 transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </Progress>
            
            <div className="hidden md:flex justify-between">
              {formConfig.steps.map((step, index) => (
                <div
                  key={step.id}
                  onClick={() => handleStepClick(index)}
                  className={`
                    flex flex-col items-center cursor-pointer
                    transition-all duration-200 w-24
                    ${index <= currentStep ? 'text-blue-600' : 'text-gray-400'}
                  `}
                >
                  <div className={`
                    w-10 h-10 rounded-full flex items-center justify-center text-sm
                    transition-all duration-300 border-2
                    ${currentStep === index
                      ? 'bg-blue-600 text-white border-blue-600 ring-4 ring-blue-100'
                      : visitedSteps.has(index)
                        ? 'bg-blue-100 text-blue-600 border-blue-200'
                        : 'bg-gray-100 text-gray-500 border-gray-200'}
                  `}>
                    {visitedSteps.has(index) && index !== currentStep ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className="text-xs mt-2 font-medium text-center line-clamp-2">
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Mobile step indicator */}
            <div className="md:hidden flex items-center justify-between mt-2 px-2">
              <div className="text-blue-600 font-medium">Step {currentStep + 1} of {formConfig.steps.length}</div>
              <div className="text-blue-800 font-semibold">{currentStepConfig.title}</div>
            </div>
          </div>
        </div>

        {/* Main content grid */}
        <div className="grid md:grid-cols-[2fr,1fr] gap-6 lg:gap-8">
          {/* Main form */}
          <Card className="shadow-lg border-0 transition-all duration-300 hover:shadow-xl">
            <CardHeader className="border-b border-gray-100 bg-white rounded-t-lg">
              <div className="flex items-center gap-4">
                {currentStepConfig.icon && (
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    {getIcon(currentStepConfig.icon, "text-blue-600")}
                  </div>
                )}
                <div>
                  <CardTitle className="text-xl md:text-2xl font-bold text-gray-800">{currentStepConfig.title}</CardTitle>
                  {currentStepConfig.description && (
                    <CardDescription className="text-gray-600 mt-1 text-sm md:text-base">{currentStepConfig.description}</CardDescription>
                  )}
                </div>
              </div>
            </CardHeader>

            <CardContent className="pt-6 pb-8 px-6 md:px-8">
              <div className="space-y-8">
                {currentStepConfig.fields.map((field, index) => (
                  <div key={`${field.name}-${index}`} className="space-y-2">
                    <Label className="text-gray-800 text-base font-semibold block mb-2">
                      {field.label}
                      {field.required && <span className="text-red-500 ml-1">*</span>}
                    </Label>

                    {field.guidance && (
                      <p className="text-sm text-gray-500 flex items-start gap-2 mb-3 bg-blue-50 p-3 rounded-lg">
                        <Info className="h-4 w-4 mt-0.5 text-blue-500" />
                        <span>{field.guidance}</span>
                      </p>
                    )}

                    {renderField(field)}
                  </div>
                ))}

                <div className="flex justify-between pt-8 border-t border-gray-100 mt-8">
                  {currentStep > 0 && (
                    <Button
                      variant="outline"
                      onClick={handlePrevious}
                      className="border-gray-300 text-gray-700 hover:bg-gray-100 hover:text-gray-900"
                    >
                      <ChevronLeft className="mr-2 h-4 w-4" />
                      Previous
                    </Button>
                  )}

<Button
                    onClick={handleNext}
                    className={clsx(
                      currentStep === 0 ? 'ml-auto' : '', // Ensure proper conditional logic
                      'bg-red-600 hover:bg-red-700 text-white px-6 py-2 h-auto font-medium'
                    )}
                  >
                    {currentStep === formConfig.steps.length - 1 ? (
                      <>
                        {submitStatus.loading ? (
                          <div className="flex items-center gap-2">
                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin "></div>
                            Submitting...
                          </div>
                        ) : (
                          <>
                            Submit Application
                            <Send className="ml-2 h-4 w-4" />
                          </>
                        )}
                      </>
                    ) : (
                      <>
                        Next
                        <ChevronRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Side panel with resources */}
          {activeResources ? (
            <Card className="shadow-lg border-0 h-fit transition-all duration-300 hover:shadow-xl bg-white">
              <CardHeader className="bg-blue-50 border-b border-blue-100 pb-4">
                <CardTitle className="text-lg md:text-xl text-blue-800 flex items-center gap-2">
                  <Info className="h-5 w-5" />
                  Available Resources
                </CardTitle>
                <CardDescription className="text-gray-600 font-medium">
                  Support services relevant to your situation
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                {/* Group resources by category */}
                {Object.entries(
                  activeResources.reduce((acc, resource) => {
                    const category = resource.category || 'other';
                    acc[category] = acc[category] || [];
                    acc[category].push(resource);
                    return acc;
                  }, {})
                ).map(([category, resources]) => (
                  <div key={category} className="mb-8 last:mb-0">
                    <h4 className="text-sm font-bold text-gray-800 uppercase tracking-wider mb-4 flex items-center">
                      {getCategoryIcon(category)}
                      {formatCategoryName(category)}
                    </h4>
                    <div className="space-y-4">
                      {resources.map((resource, index) => (
                        <div
                          key={index}
                          className={`rounded-lg p-4 border transition-all duration-200 hover:shadow-md ${getCategoryStyle(resource.category)}`}
                        >
                          <h4 className="font-semibold text-gray-900 text-base flex items-center justify-between mb-3">
                            {resource.name}
                            <span className={`text-xs px-2 py-1 rounded-full ${getCategoryBadgeStyle(resource.category)}`}>
                              {formatCategoryName(resource.category)}
                            </span>
                          </h4>
                          <div className="space-y-3">
                            {resource.phoneNumber && (
                              <a
                                href={`tel:${resource.phoneNumber.replace(/[^0-9]/g, '')}`}
                                className={`text-sm flex items-center gap-2 hover:underline ${getCategoryLinkStyle(resource.category)}`}
                              >
                                <Phone className="h-4 w-4" />
                                {resource.phoneNumber}
                              </a>
                            )}
                            {resource.location && (
                              <p className="text-sm text-gray-600 flex items-center gap-2">
                                <Home className="h-4 w-4" />
                                {resource.location}
                              </p>
                            )}
                            {resource.description && (
                              <p className="text-sm text-gray-600 flex items-start gap-2">
                                <Info className="h-4 w-4 mt-0.5" />
                                {resource.description}
                              </p>
                            )}
                            {resource.notes && (
                              <div className={`mt-2 text-sm p-3 rounded-lg flex items-start gap-2 ${getNotesStyle(resource.category)}`}>
                                <AlertCircle className="h-4 w-4 mt-0.5" />
                                <span>{resource.notes}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <Card className="shadow-lg border-0 h-fit bg-blue-50/50 hidden md:block">
              <CardContent className="p-8 flex flex-col items-center justify-center text-center h-full min-h-[200px]">
                <div className="text-blue-600 mb-4">
                  <Info className="h-10 w-10 mx-auto opacity-50" />
                </div>
                <h3 className="text-lg font-medium text-blue-800 mb-2">Resource Information</h3>
                <p className="text-gray-600">
                  As you complete the form, we'll provide relevant resources 
                  based on your situation.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper functions for resources styling
function getCategoryIcon(category) {
  switch(category) {
    case 'emergency':
      return <AlertCircle className="h-4 w-4 mr-2 text-red-600" />;
    case 'Shelters':
      return <Home className="h-4 w-4 mr-2 text-blue-600" />;
    case 'legal':
      return <Scale className="h-4 w-4 mr-2 text-green-600" />;
    default:
      return <Info className="h-4 w-4 mr-2 text-gray-600" />;
  }
}

function formatCategoryName(category) {
  return category.charAt(0).toUpperCase() + category.slice(1);
}

function getCategoryStyle(category) {
  switch(category) {
    case 'emergency':
      return 'bg-red-50 border-red-100';
    case 'Shelters':
      return 'bg-blue-50 border-blue-100';
    case 'legal':
      return 'bg-green-50 border-green-100';
    default:
      return 'bg-gray-50 border-gray-200';
  }
}

function getCategoryBadgeStyle(category) {
  switch(category) {
    case 'emergency':
      return 'bg-red-100 text-red-700';
    case 'Shelters':
      return 'bg-blue-100 text-blue-700';
    case 'legal':
      return 'bg-green-100 text-green-700';
    default:
      return 'bg-gray-100 text-gray-600';
  }
}

function getCategoryLinkStyle(category) {
  switch(category) {
    case 'emergency':
      return 'text-red-600 hover:text-red-800';
    case 'Shelters':
      return 'text-blue-600 hover:text-blue-800';
    case 'legal':
      return 'text-green-600 hover:text-green-800';
    default:
      return 'text-gray-600 hover:text-gray-800';
  }
}

function getNotesStyle(category) {
  switch(category) {
    case 'emergency':
      return 'bg-red-100 text-red-700';
    case 'Shelters':
      return 'bg-blue-100 text-blue-700';
    case 'legal':
      return 'bg-green-100 text-green-700';
    default:
      return 'bg-amber-50 text-amber-700';
  }
}

function getIcon(iconName, className = "") {
  const icons = {
    Shield: <Shield className={`h-6 w-6 ${className}`} />,
    User: <User className={`h-6 w-6 ${className}`} />,
    Phone: <Phone className={`h-6 w-6 ${className}`} />,
    DollarSign: <DollarSign className={`h-6 w-6 ${className}`} />,
    Scale: <Scale className={`h-6 w-6 ${className}`} />,
  };
  return icons[iconName] || null;
}