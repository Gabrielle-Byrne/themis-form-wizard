"use client"
import React, { useState, useEffect, useRef } from 'react';
import clsx from 'clsx';
import { 
  AlertCircle,
  Shield,
  User,
  Phone,
  Home,
  DollarSign,
  Scale,
  ChevronRight,
  ChevronLeft,
  Info,
  CheckCircle,
  Upload,
  X,
  Loader2,
  FileText,
  RefreshCcw,
  Menu,
  ArrowRight,
  HelpCircle,
  Mail,
  Send
} from 'lucide-react';

import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import configData from '../eligibility-editor-legal-clinic-unb/api/dummy.json';
import { validationRules, combineValidations } from '../lib/validationRules';

import { submitFormWithFiles } from '../lib/api';
import { saveFormData } from './formHelper';

export default function LegalClinicForm() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});
  const [errors, setErrors] = useState({});
  const [progress, setProgress] = useState(0);
  const [visitedSteps, setVisitedSteps] = useState(new Set([0]));
  const [activeResources, setActiveResources] = useState(null);
  const [showEmergencyAlert, setShowEmergencyAlert] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [submitStatus, setSubmitStatus] = useState({ loading: false, error: null });
  const [showSuccess, setShowSuccess] = useState(false);
  const [submissionId, setSubmissionId] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const fileInputRef = useRef(null);
  const formRef = useRef(null);
  const [ formConfig , setConfig] = useState(configData.formConfig);
  const [RESOURCES, setResources] = useState(null);
  const [MONTHLY_THRESHOLDS, setThresholds] = useState(null);

  // Gets the form template from the api
  useEffect(() => {
    async function fetchEligibilityData() {
      try {
        const res = await fetch('/api/eligibility');
        const data = await res.json();
        if (!res.ok) {
          throw new Error(`Error fetching data: ${data.message || 'Unknown error'}`);
        }
        const dataForm = data[data.length-1];
        setThresholds(dataForm.MONTHLY_THRESHOLDS);
        setResources(dataForm.RESOURCES);
        setConfig({...dataForm.formConfig});
      } catch (error) {
        console.error('Failed to fetch eligibility data:', error);
      }
    }

    fetchEligibilityData()
  }, [ ]);

  // Helper function to filter resources by category and criteria
  const filterResourcesByCategory = (resources, category, criteria = {}) => {
    return resources
      .filter(resource => resource.category === category)
      .filter(resource => {
        if (criteria.gender && resource.notes?.toLowerCase().includes(`${criteria.gender} only`)) {
          return true;
        }
        if (criteria.isFirstNations && resource.notes?.toLowerCase().includes('first nations')) {
          return true;
        }
        if (criteria.age && resource.notes) {
          if (criteria.age < 25 && resource.notes.toLowerCase().includes('youth')) {
            return true;
          }
        }
        return !resource.notes || 
              (!resource.notes.toLowerCase().includes('only') && 
               !resource.notes.toLowerCase().includes('first nations'));
      });
  };

  const resetForm = () => {
    setFormData({});
    setErrors({});
    setCurrentStep(0);
    setVisitedSteps(new Set([0]));
    setSelectedFiles([]);
    setSubmitStatus({ loading: false, error: null });
    setShowSuccess(false);
    setSubmissionId(null);
    setActiveResources(null);
    setShowEmergencyAlert(false);
  };

  useEffect(() => {
    const newProgress = ((currentStep + 1) / formConfig.steps.length) * 100;
    setProgress(newProgress);
  }, [currentStep]);

  // Set default resources on initial load
  useEffect(() => {
    // Display emergency resources by default
    if (RESOURCES && RESOURCES.emergency) {
      setActiveResources(RESOURCES.emergency);
    }
  }, [RESOURCES]);

  // Scroll to top of form when step changes
  useEffect(() => {
    if (formRef.current) {
      formRef.current.scrollTo(0, 0);
    }
  }, [currentStep]);

  const validateField = (field, value, allData = formData) => {
    // First check if field is required
    if (field.required && (!value || value === '')) {
      return {
        isValid: false,
        message: `${field.label} is required`
      };
    }
  
    // Check if field has validation rules defined
    if (field.validation?.rules) {
      // Get the validation rule for this field
      if (typeof field.validation.rules === 'string') {
        // Single rule
        const rule = validationRules[field.validation.rules];
        if (rule) {
          return rule(value, allData);
        }
      } else if (Array.isArray(field.validation.rules)) {
        // Multiple rules
        const rules = field.validation.rules.map(ruleName => validationRules[ruleName]);
        return combineValidations(rules)(value, allData);
      }
    }
  
    return { isValid: true };
  };

  const validateStep = (stepIndex) => {
    const step = formConfig.steps[stepIndex];
    const newErrors = {};
    let isValid = true;

    for (const field of step.fields) {
      const validation = validateField(field, formData[field.name]);
      if (!validation.isValid) {
        newErrors[field.name] = validation.message;
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    setSelectedFiles(prev => [...prev, ...files]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (fileIndex) => {
    setSelectedFiles(prev => prev.filter((_, index) => index !== fileIndex));
  };

  // FOR EMAIL
  const handleSubmit = async () => {
    if (!validateStep(currentStep)) {
      return;
    }

    const submitData = new FormData();

    // Append individual fields from formData (best approach)
    for (const [key, value] of Object.entries(formData)) {
      if (typeof value === 'string' || value instanceof Blob) {
        submitData.append(key, value);
      } else {
        submitData.append(key, JSON.stringify(value)); //  fallback
      }
    }
    // Append multiple files (same key = valid)
    if (selectedFiles && selectedFiles.length > 0) {
      selectedFiles.forEach((file) => {
        submitData.append('files', file); // 'files' stays same for all files
      });
    }
    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        body: JSON.stringify({
          formData
        }),  
      });

      const result = await res.json();
      setSubmissionId(result.submissionId);
      //setShowSuccess(true);
      setSubmitStatus({ loading: false, error: null });
    } catch (error) {
        setSubmitStatus({ 
          loading: false, 
          error: 'Failed to submit form. Please try again.' 
        });
    }
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
    
    // Run validation and handle results
    if (field) {
      const validationResult = validateField(field, value, newData);
      
      if (!validationResult.isValid) {
        setErrors(prev => ({
          ...prev,
          [name]: validationResult.message
        }));
      }
  
      // Handle resources if provided in validation result
      if (validationResult.resources) {
        setActiveResources(validationResult.resources);
      }
  
      // Handle emergency alerts
      if (validationResult.terminateIfInvalid) {
        setShowEmergencyAlert(true);
      }
    }
  
    // Handle resource updates based on field changes
    handleResourceUpdates(name, value, newData);
  };

  const handleResourceUpdates = (name, value, newData) => {
    // Initialize resources array
    let updatedResources = [];
  
    // Handle emergency situations
    if (name === 'immediateRisk') {
      if (value === 'yes') {
        setShowEmergencyAlert(true);
        updatedResources.push(...RESOURCES.emergency);
      } else {
        setShowEmergencyAlert(false);
      }
    }
  
    // Handle shelter needs
    if (['shelterNeeded', 'housingStatus'].includes(name)) {
      if (value === 'yes' || value === 'emergency') {
        updatedResources.push(...filterResourcesByCategory(
          RESOURCES.shelters,
          'shelters',
          {
            gender: newData.gender,
            isFirstNations: newData.indigenous === 'first-nations',
            age: calculateAge(newData.dateOfBirth)
          }
        ));
      }
    }

    // Handle legal issue type
    if (name === 'legalIssueType') {
      // Map legal issue types to relevant resource categories
      const resourceMap = {
        'housing': ['shelters', 'legal'],
        'benefits': ['legal'],
        'employment': ['legal'],
        'human-rights': ['legal'],
        'small-claims': ['legal'],
        'notary': ['legal'],
        'divorce': ['legal'],
        'provincial-offences': ['legal'],
        'immigration': ['legal']
      };
      
      if (resourceMap[value]) {
        // Get all legal resources
        const allLegalResources = RESOURCES.legal || [];
        
        // Filter legal resources based on the selected issue type
        const filteredLegalResources = allLegalResources.filter(resource => {
          if (value === 'housing' && resource.matters?.toLowerCase().includes('tenant')) {
            return true;
          } else if (value === 'employment' && resource.matters?.toLowerCase().includes('employment')) {
            return true;
          } else if (value === 'human-rights' && resource.matters?.toLowerCase().includes('human rights')) {
            return true;
          } else if (value === 'divorce' && resource.matters?.toLowerCase().includes('family')) {
            return true;
          } else if (value === 'immigration' && resource.matters?.toLowerCase().includes('refugee')) {
            return true;
          }
          
          // Include general legal resources for all categories
          return resource.matters === 'General' || resource.matters?.toLowerCase().includes(value.toLowerCase());
        });
        
        // Add filtered resources to our updated resources
        updatedResources.push(...filteredLegalResources);
        
        // Always include emergency resources when legal issues are selected
        updatedResources.push(...RESOURCES.emergency);
      }
    }
    // // Handle indigenous status
    // if (name === 'indigenous' && value === 'first-nations') {
    //   // Add First Nations specific resources
    //   const firstNationsResources = RESOURCES.shelters.filter(
    //     resource => resource.notes?.toLowerCase().includes('first nations')
    //   );
    //   updatedResources.push(...firstNationsResources);
    // }

    // // Handle disability status
    // if (name === 'disabilty' && value === 'yes') {
    //   // Add First Nations specific resources
    //   const disabilityResources = RESOURCES.shelters.filter(
    //     resource => resource.notes?.toLowerCase().includes('disability')
    //   );
    //   updatedResources.push(...disabilityResources);
    // }
    
    // // Handle gender-specific resources
    // if (name === 'gender') {
    //   if (value === 'female') {
    //     // Add women-only resources
    //     const womenResources = RESOURCES.shelters.filter(
    //       resource => resource.notes?.toLowerCase().includes('women only')
    //     );
    //     updatedResources.push(...womenResources);
    //   }
    // }
    
    // Handle financial eligibility steps
    if (['householdSize', 'totalMonthlyIncome', 'totalAssets'].includes(name)) {
      // Determine if they might qualify for legal aid or not
      const householdSize = parseInt(newData.householdSize) || 1;
      const sizeKey = Math.min(householdSize, 6).toString();
      
      if (MONTHLY_THRESHOLDS && MONTHLY_THRESHOLDS[sizeKey]) {
        const threshold = MONTHLY_THRESHOLDS[sizeKey];
        const monthlyIncome = parseFloat(newData.totalMonthlyIncome) || 0;
        const assets = parseFloat(newData.totalAssets) || 0;
        
        // If they exceed thresholds, recommend private legal resources
        if (monthlyIncome > threshold.income || assets > threshold.assets) {
          // Show them appropriate legal resources for private assistance
          const legalResources = RESOURCES.legal.filter(resource => 
            resource.name.includes("Fredericton Legal Advice Clinic") || 
            resource.name.includes("Public Legal Education")
          );
          updatedResources.push(...legalResources);
        } else {
          // Show Legal Aid resources
          const legalAidResources = RESOURCES.legal.filter(resource => 
            resource.name.includes("New Brunswick Legal Aid") ||
            resource.name.includes("Family Law Advice")
          );
          updatedResources.push(...legalAidResources);
        }
      }
    }
    
    // Handle housing status
    if (name === 'housingStatus' && value === 'emergency') {
      // Add shelter resources
      updatedResources.push(...RESOURCES.shelters);
    }
    
    // Handle document submission step
    if (name === 'documentsSubmitted') {
      // Provide information resources
      const informationResources = RESOURCES.legal.filter(resource => 
        resource.name.includes("Public Legal Education")
      );
      updatedResources.push(...informationResources);
    }
    
    // Handle legal issue deadline
    if (name === 'hasDeadline' && value === 'yes') {
      // Add emergency legal resources
      updatedResources.push(...RESOURCES.emergency);
      const urgentLegalResources = RESOURCES.legal.filter(resource => 
        resource.name.includes("Fredericton Legal Advice Clinic")
      );
      updatedResources.push(...urgentLegalResources);
    }
  
    // Ensure we're not setting empty resources and are removing duplicates
    if (updatedResources.length > 0) {
      const uniqueResources = Array.from(
        new Set(updatedResources.map(r => r.name))
      ).map(name => updatedResources.find(r => r.name === name));
      
      setActiveResources(uniqueResources);
    } else if (RESOURCES && RESOURCES.emergency) {
      // Default to showing emergency resources if nothing else is matched
      setActiveResources(RESOURCES.emergency);
    }
  };

  const calculateAge = (birthDate) => {
    if (!birthDate) return null;
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const calculateDate = (curDate) => {
    if (!curDate) return null;
    const today = new Date();
    const courtDate = new Date(curDate);
    if (today.getDate() < courtDate.getDate()) {
      return false;
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      setVisitedSteps(prev => new Set([...prev, nextStep]));
    }
  };

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  };

  const handleStepClick = (index) => {
    if (visitedSteps.has(index) || (index === currentStep + 1 && validateStep(currentStep))) {
      setCurrentStep(index);
      setVisitedSteps(prev => new Set([...prev, index]));
      setIsMobileMenuOpen(false);
    }
  };

  const getIcon = (iconName) => {
    const icons = {
      AlertCircle,
      Shield,
      User,
      Phone,
      Home,
      DollarSign,
      Scale,
      Send
    };
    const IconComponent = icons[iconName];
    return IconComponent ? <IconComponent className="h-5 w-5" /> : null;
  };

  const renderField = (field) => {
    const hasError = errors[field.name];
    const commonClasses = `
      w-full p-3 rounded-lg border transition-all
      focus:border-blue-500
      ${hasError ? 'border-red-500 bg-red-50' : 'border-gray-200'}
    `;

    // Special handling for checkbox groups
    if (field.type === 'checkbox-group') {
      return (
        <div className="space-y-3">
          {field.options.map(option => (
            <div
              key={option.value}
              className="flex items-center gap-2"
            >
              <input
                type="checkbox"
                id={`${field.name}-${option.value}`}
                checked={formData[field.name]?.includes(option.value) || false}
                onChange={(e) => {
                  const currentValues = formData[field.name] || [];
                  const newValues = e.target.checked
                    ? [...currentValues, option.value]
                    : currentValues.filter(v => v !== option.value);
                  handleFieldChange(field.name, newValues);
                }}
                className="w-4 h-4 rounded border-gray-300 text-blue-600"
              />
              <label htmlFor={`${field.name}-${option.value}`}>
                {option.label}
              </label>
            </div>
          ))}
        </div>
      );
    }
    //SHOW IF HANDLING
    // if (field.showif) {
    //     const [dependentField, expectedValue] = field.showIf.split(' === ');
    //     if (formData[dependentField] !== expectedValue.replace(/['"]/g, '')) {
    //       continue;
    //     }
    //   }
    // }

    // Special handling for number fields with currency
    if (field.type === 'number') {
       if(
        field.name.toLowerCase().includes('income') || 
        field.name.toLowerCase().includes('expense') || 
        field.label.toLowerCase().includes('amount') || 
        field.name.toLowerCase().includes('assets')) {
        return (
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <input
              type="number"
              value={formData[field.name] || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className={`${commonClasses} pl-8`}
              min="0"
              step="0.01"
            />
          </div>
        );
      }
      return (
          <div className="relative">
            <input
              type="number"
              value={formData[field.name] || ''}
              onChange={(e) => handleFieldChange(field.name, e.target.value)}
              className={`${commonClasses}`}
              min="0"
              step="1"
            />
          </div>
        );
    }

    switch (field.type) {
      case 'radio':
        return (
          <div className="space-y-3">
            {field.options.map(option => (
              <div
                key={option.value}
                onClick={() => handleFieldChange(field.name, option.value)}
                className={`
                  flex items-center p-4 rounded-lg border cursor-pointer
                  ${formData[field.name] === option.value 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200 hover:bg-gray-50'}
                `}
              >
                <div className={`
                  w-5 h-5 rounded-full border-2 mr-3 
                  flex items-center justify-center
                  ${formData[field.name] === option.value 
                    ? 'border-blue-500' 
                    : 'border-gray-400'}
                `}>
                  {formData[field.name] === option.value && (
                    <div className="w-3 h-3 rounded-full bg-blue-500" />
                  )}
                </div>
                <span>{option.label}</span>
              </div>
            ))}
          </div>
        );

      case 'checkbox':
        return (
          <div
            onClick={() => handleFieldChange(field.name, !formData[field.name])}
            className={`
              flex items-center p-4 rounded-lg border cursor-pointer
              ${formData[field.name] 
                ? 'border-blue-500 bg-blue-50' 
                : 'border-gray-200 hover:bg-gray-50'}
            `}
          >
            <div className={`
              w-5 h-5 rounded mr-3 border-2
              flex items-center justify-center
              ${formData[field.name] ? 'border-blue-500 bg-blue-500' : 'border-gray-400'}
            `}>
              {formData[field.name] && (
                <CheckCircle className="w-4 h-4 text-white" />
              )}
            </div>
            <span>{field.label}</span>
          </div>
        );

      case 'select':
        return (
          <select
            value={formData[field.name] || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={commonClasses}
          >
            <option value="">Select an option</option>
            {field.options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            value={formData[field.name] || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={`${commonClasses} min-h-[120px]`}
          />
        );

      default:
        return (
          <input
            type={field.type}
            value={formData[field.name] || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={commonClasses}
          />
        );
    }
  };

  const currentStepConfig = formConfig.steps[currentStep];

  // File upload section
  const FileUploadSection = () => (
    <div className="mt-8 p-6 border border-dashed border-gray-300 rounded-lg bg-gray-50">
      <div className="flex flex-col items-center">
        <h4 className="font-medium text-gray-900 mb-2">Supporting Documents Submission</h4>
        <p className="text-sm text-gray-500 text-center mb-4">
          Any supporting documents related to this matter must be sent to 
          <a href="mailto:lawclinic@unb.ca" className="text-blue-600 hover:underline"> lawclinic@unb.ca </a> 
          with the email subject formatted as your First Name, Last Name - Issue's Category. 
          For example: John Doe - Housing and Tenancy.
        </p>
        <p className="text-sm text-gray-500 text-center mb-4">
          Additionally, it is mandatory to send the following information:
        </p>
        <ul className="list-disc text-sm text-gray-500 pl-5">
          <li>Proof of identification</li>
          <li>
            Supporting documents for your financial eligibility, including monthly income, 
            allowable deductions, and assets.
          </li>
        </ul>
        <p className="text-sm text-gray-500 text-center mt-4">
          Please note that applications will not be reviewed without the required supporting 
          documents or mandatory documents.
        </p>
      </div>
    </div>
  );

  const SuccessModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">
            Application Submitted Successfully
          </h2>
          <p className="mt-2 text-gray-600">
            Your application has been received. Reference ID: {submissionId}
          </p>
          <div className="mt-6 space-y-3">
            <button
              onClick={() => {
                window.location.href = '/thank-you';
              }}
              className="w-full px-4 py-2 text-sm font-medium text-white bg-blue-600 
                rounded-lg hover:bg-blue-700"
            >
              Continue to Thank You Page
            </button>
            <button
              onClick={() => {
                resetForm();
                setShowSuccess(false);
              }}
              className="w-full px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 
                rounded-lg hover:bg-gray-200 flex items-center justify-center gap-2"
            >
              <RefreshCcw className="w-4 h-4" />
              Submit Another Application
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b  md:py-6 px-4 md:px-8">
      {showSuccess && <SuccessModal />}
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <Card className="mb-6 shadow-lg overflow-hidden">
          <div className="h-2 bg-gradient-to-r from-blue-600 via-red-500 to-blue-600 w-fulll"></div>
          <CardHeader className="pb-6 pt-6">
            <CardTitle className="text-2xl md:text-3xl text-center text-blue-800 font-bold">
              {formConfig.metadata.clinic.name}
            </CardTitle>
            <CardDescription className="text-center text-gray-600 mt-2">
              <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4">
                <span className="flex items-center">
                  <Phone className="w-4 h-4 text-blue-500 mr-1" /> 
                  <a href={`tel:${formConfig.metadata.clinic.phone.replace(/[^0-9]/g, '')}`} className="hover:text-blue-600">
                    {formConfig.metadata.clinic.phone}
                  </a>
                </span>
                <span className="hidden md:inline text-gray-300">•</span>
                <span className="flex items-center">
                  <Mail className="w-4 h-4 text-blue-500 mr-1" /> 
                  <a href={`mailto:${formConfig.metadata.clinic.email}`} className="hover:text-blue-600">
                    {formConfig.metadata.clinic.email}
                  </a>
                </span>
                <span className="hidden md:inline text-gray-300">•</span>
                <span className="flex items-center">
                  <Home className="w-4 h-4 text-blue-500 mr-1" /> 
                  {formConfig.metadata.clinic.address}
                </span>
              </div>
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Improved Progress Indicator */}
        <div className="mb-8">
          <div className="bg-white rounded-xl p-6 shadow-md border border-gray-200">
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center">
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                    <CheckCircle className="w-4 h-4 text-blue-600" />
                  </div>
                  <h3 className="text-sm font-medium text-gray-700">Your Progress</h3>
                </div>
                <span className="text-sm font-medium bg-blue-600 text-white px-3 py-1 rounded-full">
                  Step {currentStep + 1} of {formConfig.steps.length}
                </span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-blue-500 to-red-600 transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            
            {/* Steps Indicator - Desktop */}
            <div className="hidden md:flex justify-between">
              {formConfig.steps.map((step, index) => (
                <div 
                  key={step.id}
                  onClick={() => handleStepClick(index)}
                  className={`
                    flex flex-col items-center cursor-pointer group
                    ${index <= currentStep ? 'text-blue-600' : 'text-gray-400'}
                    ${visitedSteps.has(index) ? '' : 'pointer-events-none opacity-60'}
                  `}
                >
                  <div className={`
                    w-8 h-8 rounded-full flex items-center justify-center text-sm mb-1
                    transition-all duration-300
                    ${currentStep === index 
                      ? 'bg-blue-600 text-white' 
                      : visitedSteps.has(index)
                      ? 'bg-blue-100 text-blue-600 group-hover:bg-blue-200'
                      : 'bg-gray-100 text-gray-500'}
                  `}>
                    {visitedSteps.has(index) && index < currentStep ? (
                      <CheckCircle className="w-4 h-4" />
                    ) : (
                      index + 1
                    )}
                  </div>
                  <span className="text-xs font-medium text-center max-w-22 truncate">
                    {step.title}
                  </span>
                </div>
              ))}
            </div>
            
            {/* Steps Indicator - Mobile */}
            <div className="md:hidden">
              <div className="flex items-center justify-between">
                <button
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className={`
                    p-2 rounded ${currentStep === 0 ? 'text-gray-300' : 'text-blue-600'}
                  `}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="text-sm font-medium flex items-center gap-2">
                  <button
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="flex items-center gap-2 text-gray-700 bg-gray-100 py-1 px-3 rounded-full"
                  >
                    {currentStepConfig.title}
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
                
                <button
                  onClick={handleNext}
                  disabled={currentStep === formConfig.steps.length - 1}
                  className={`
                    p-2 rounded ${currentStep === formConfig.steps.length - 1 ? 'text-gray-300' : 'text-blue-600'}
                  `}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              
              {/* Mobile Step Menu */}
              {isMobileMenuOpen && (
                <div className="mt-2 bg-white border border-gray-200 rounded-lg shadow-lg absolute z-10 left-4 right-4">
                  {formConfig.steps.map((step, index) => (
                    <div
                      key={step.id}
                      onClick={() => handleStepClick(index)}
                      className={`
                        flex items-center gap-3 p-3 border-b border-gray-100 last:border-b-0
                        ${currentStep === index ? 'bg-blue-50' : ''}
                        ${visitedSteps.has(index) ? 'cursor-pointer' : 'opacity-50'}
                      `}
                    >
                      <div className={`
                        w-6 h-6 rounded-full flex items-center justify-center text-xs
                        ${currentStep === index 
                          ? 'bg-blue-600 text-white' 
                          : visitedSteps.has(index)
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-gray-100 text-gray-500'}
                      `}>
                        {visitedSteps.has(index) && index < currentStep ? (
                          <CheckCircle className="w-3 h-3" />
                        ) : (
                          index + 1
                        )}
                      </div>
                      <span className={`text-sm ${currentStep === index ? 'font-medium text-blue-700' : 'text-gray-700'}`}>
                        {step.title}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Emergency alert */}
        {currentStep === 0 && showEmergencyAlert && (
          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg shadow-md p-5 animate-pulse">
              <div className="flex items-start gap-4">
                <div className="bg-red-100 p-3 rounded-full">
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                </div>
                <div>
                  <h3 className="font-semibold text-red-800 text-lg">
                    Emergency Assistance Required
                  </h3>
                  <p className="text-red-700 mt-1">
                    If you are in immediate danger, please call 911 or your local emergency services immediately.
                  </p>
                  <div className="mt-4 bg-white rounded-lg p-4 border border-red-200 shadow-inner">
                    <h4 className="font-medium text-red-800 mb-2">Emergency Contacts:</h4>
                    <div className="space-y-3">
                      {RESOURCES.emergency.map((resource, index) => (
                        <div key={index} className="flex items-start gap-3 p-2 border-b border-red-100 last:border-b-0">
                          <div className="bg-red-50 p-1.5 rounded-full">
                            <Phone className="w-4 h-4 text-red-600" />
                          </div>
                          <div>
                            <a href={`tel:${resource.phoneNumber.replace(/[^0-9]/g, '')}`} >
                            <p className="font-medium text-red-800">{resource.name}</p>
                            <p className="text-red-600 flex items-center gap-1">
                              <a href={`tel:${resource.phoneNumber.replace(/[^0-9]/g, '')}`} 
                                 className="hover:underline flex items-center gap-1">
                                {resource.phoneNumber}
                                <ArrowRight className="w-3 h-3" />
                              </a>
                            </p>
                            </a>
                            {resource.description && (
                              <p className="text-sm text-red-700 mt-1">{resource.description}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      <div className="id">
        
        
        {/* Income Thresholds Information */}
        {currentStep === 3 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <div className="bg-blue-100 p-2.5 rounded-full h-fit">
                <DollarSign className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <h3 className="font-medium text-blue-800 mb-2">Financial Eligibility Guidelines</h3>
                <p className="text-sm text-blue-700 mb-3">The following income and asset upper thresholds determine eligibility for our services:</p>
                
                <div className="overflow-x-auto">
                  <table className="min-w-full bg-white border border-gray-200 rounded-lg">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Household Size</th>
                        <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Monthly Income</th>
                        <th className="py-2 px-4 border-b text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Asset Limit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.entries(MONTHLY_THRESHOLDS || {}).map(([size, thresholds]) => (
                        <tr key={size} className="border-b hover:bg-gray-50">
                          <td className="py-2 px-4 text-sm">{size} {size === '1' ? 'person' : 'people'}</td>
                          <td className="py-2 px-4 text-sm">${thresholds.income.toLocaleString()}</td>
                          <td className="py-2 px-4 text-sm">${thresholds.assets.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-blue-700 mt-3">
                  If your income or assets exceed these limits, we recommend contacting the 
                    <a href="https://flac.cliogrow.com/" className='font-bold'> Fredericton Legal Advice Clinic</a> or 
                    <a href="https://www.legal-info-legale.nb.ca/" className='font-bold'> Public Legal Education</a>
                </p>
                <p className="text-sm text-blue-700 mt-3">
                  Note: These thresholds may be adjusted based on special circumstances. 
                  All financial information will be kept confidential.
                </p>
              </div>
            </div>
          </div>
        )}
        
        {/* Legal Issue Type Information */}
        {currentStep === 4 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex gap-3">
              <div className="bg-blue-100 p-2.5 rounded-full h-fit">
                <Scale className="w-5 h-5 text-blue-700" />
              </div>
              <div>
                <h3 className="font-medium text-blue-800 mb-2">About Our Legal Services</h3>
                <p className="text-sm text-blue-700 mb-3">
                  The UNB Legal Clinic provides assistance with various legal matters. 
                  Based on your issue type, we'll connect you with appropriate resources and services.
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <h4 className="text-sm font-medium text-gray-900">Services We Provide</h4>
                    <ul className="mt-2 text-xs text-gray-700 space-y-1.5 list-disc pl-5">
                      <li>Housing and tenancy disputes</li>
                      <li>Provincial and federal benefits</li>
                      <li>Employment law matters</li>
                      <li>Human rights issues</li>
                      <li>Small claims</li>
                    </ul>
                  </div>
                  
                  <div className="bg-white rounded-lg p-3 border border-blue-200">
                    <h4 className="text-sm font-medium text-gray-900">Additional Services</h4>
                    <ul className="mt-2 text-xs text-gray-700 space-y-1.5 list-disc pl-5">
                      <li>Notary/Commissioner services</li>
                      <li>Uncontested divorce assistance</li>
                      <li>Provincial offences (tickets)</li>
                      <li>Immigration guidance</li>
                      <li>Referrals to specialty legal resources</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

        {/* Main content grid */}
        <div className="grid gap-6">
          {/* Main form */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden">
            {/* Step header */}
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-white">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-full shadow-sm">
                  {getIcon(currentStepConfig.icon)}
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">
                    {currentStepConfig.title}
                  </h2>
                  <div className="flex flex-wrap items-center mt-1 gap-2">
                    {currentStepConfig.critical && (
                      <span className="bg-red-100 text-red-800 text-xs px-2 py-0.5 rounded-full flex items-center">
                        <AlertCircle className="w-3 h-3 mr-1" />
                        Critical
                      </span>
                    )}
                    {currentStepConfig.guidance && (
                      <p className="text-gray-600 text-sm">
                        {currentStepConfig.guidance}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

        {/* Form fields */}
            <div className="p-6">
              <div ref={formRef} className="max-h-[600vh] overflow-y-auto pr-2 space-y-6 scrollbar-thin">
                {currentStepConfig.fields.map(field => (
                  <div key={field.name} className="mb-8 last:mb-0 animate-fadeIn">
                    
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        {field.label}
                        {field.required && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </label>
                      {field.guidance && (
                        <div className="group relative">
                          <Info className="w-4 h-4 text-gray-400 cursor-help" />
                          <div className="absolute right-0 w-64 p-3 bg-gray-800 text-white text-xs rounded-lg 
                            shadow-lg opacity-0 group-hover:opacity-100 transition-opacity z-10 
                            pointer-events-none">
                            {field.guidance}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Special handling for disclaimer fields */}
                    {field.name === 'intakeDisclaimer' && (
                      <div className="mb-4">
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg mb-3">
                          <p className="text-base text-gray-600">
                            This form is for initial eligibility screening purposes only. Submitting this form does not create an 
                            attorney-client relationship. The legal clinic will review your information and contact you regarding 
                            your eligibility for services. Please note that our services are limited and not all applicants can be accepted.
                          </p>
                        </div>
                        {renderField(field)}
                      </div>
                    )}
                    
                    {/* Special handling for email consent field */}
                    {field.name === 'emailCommunicationConsent' && (
                      <div className="mb-4">
                        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg mb-3">
                          <p className="text-base text-gray-600">
                            Email is not a completely secure or confidential method of communication. By accepting, you acknowledge 
                            the risks of email communication and authorize the legal clinic to communicate with you via email regarding 
                            your case, including sending documents and information related to your matter.
                          </p>
                        </div>
                        {renderField(field)}
                      </div>
                    )}
                    
                    {/* Regular fields */}
                    {!['intakeDisclaimer', 'emailCommunicationConsent'].includes(field.name) && renderField(field)}

                    {errors[field.name] && (
                      <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded-md flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{errors[field.name]}</span>
                      </div>
                    )}
                  </div>
                ))}

                {/* Show file upload on final step */}
                {currentStep === formConfig.steps.length - 1 && <FileUploadSection />}
              </div>

              {/* Navigation */}
              <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={currentStep === 0}
                  className={`
                    px-4 py-2 rounded-lg flex items-center gap-2 transition-colors
                    ${currentStep === 0 
                      ? 'text-gray-400 cursor-not-allowed' 
                      : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50 border border-gray-200'}
                  `}
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>

                {currentStep === formConfig.steps.length - 1 ? (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitStatus.loading}
                    className="px-6 py-2 text-sm font-medium text-white bg-blue-600 
                      rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2
                      shadow-sm transition-all hover:shadow focus:ring-2 focus:ring-blue-300"
                  >
                    {submitStatus.loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        Submit Application
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-5 py-2 text-sm font-medium text-white bg-blue-600 
                      rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2
                      shadow-sm transition-all hover:shadow focus:ring-2 focus:ring-blue-300"
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Side panel */}
          <div className="space-y-6">
            {/* Required Documents */}
            {currentStepConfig.requiredDocuments && (
              <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                <h3 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  Required Documents
                </h3>
                <ul className="space-y-3">
                  {currentStepConfig.requiredDocuments.map((doc, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-gray-600 p-2 bg-gray-50 rounded-md">
                      <CheckCircle className="w-4 h-4 mt-0.5 text-blue-400" />
                      <span>{doc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Resources - Always Visible */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-md overflow-hidden hidden top-4">
              <div className="bg-gradient-to-r from-blue-600 to-blue-500 p-4 border-b border-blue-100 text-white flex justify-between items-center">
                <div>
                  <h3 className="font-medium text-white flex items-center gap-2">
                    <HelpCircle className="w-5 h-5 text-white" />
                    Community Resources
                  </h3>
                  <p className="text-xs text-blue-50 mt-1">
                    {activeResources 
                      ? "Based on your responses, these resources may help" 
                      : "Support services available in your community"}
                  </p>
                </div>
                
              </div>
              
              <div className="p-4 max-h-[calc(200vh-600vh)] overflow-y-auto">
                {!activeResources && (
                  <div className="py-6 px-4 text-center">
                    <div className="bg-blue-50 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                      <HelpCircle className="w-8 h-8 text-blue-500" />
                    </div>
                    <h4 className="text-gray-700 font-medium mb-2">Resources Will Appear Here</h4>
                    <p className="text-sm text-gray-500">
                      As you complete the form, we'll suggest relevant resources based on your needs.
                    </p>
                    
                    {/* Quick Links to Common Resources */}
                    <div className="mt-6 border-t pt-4 border-gray-100">
                      <p className="text-xs text-gray-500 mb-3 font-medium">COMMON RESOURCES</p>
                      <div className="space-y-2">
                        {RESOURCES && RESOURCES.emergency && RESOURCES.emergency.map((resource, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-gray-50 rounded-md hover:bg-gray-100 transition-colors">
                            <Phone className="w-4 h-4 text-blue-500" />
                            <a 
                              href={`tel:${resource.phoneNumber?.replace(/[^0-9]/g, '') || ''}`}
                              className="text-sm text-blue-600 hover:underline"
                            >
                              {resource.name}
                            </a>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {activeResources && Object.entries(
                  activeResources.reduce((acc, resource) => {
                    const category = resource.category || 'other';
                    acc[category] = acc[category] || [];
                    acc[category].push(resource);
                    return acc;
                  }, {})
                ).map(([category, resources]) => (
                  <div key={category} className="mb-6 last:mb-0">
                    <div className="flex items-center gap-2 mb-3 pb-1 border-b border-gray-100">
                      <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                      <h4 className="text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        {category.replace(/([A-Z])/g, ' $1').trim()}
                      </h4>
                    </div>
                    
                    <div className="space-y-3">
                      {resources.map((resource, index) => (
                        <div 
                          key={index} 
                          className="bg-white rounded-lg p-4 border border-gray-200 hover:border-blue-300 
                          hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-start">
                            <div className="flex-grow">
                              <h4 className="font-medium text-gray-900">
                                {resource.name}
                              </h4>
                              
                              <div className="mt-2 space-y-2">
                                {resource.phoneNumber && (
                                  <p className="text-sm flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-blue-500" />
                                    <a 
                                      href={`tel:${resource.phoneNumber.replace(/[^0-9]/g, '')}`}
                                      className="text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                                    >
                                      {resource.phoneNumber}
                                    </a>
                                  </p>
                                )}
                                
                                {resource.location && (
                                  <p className="text-sm text-gray-600 flex items-center gap-2">
                                    <Home className="w-4 h-4 text-gray-500" />
                                    {resource.location}
                                  </p>
                                )}
                                
                                {resource.email && (
                                  <p className="text-sm text-gray-600 flex items-center gap-2">
                                    <Mail className="w-4 h-4 text-gray-500" />
                                    <a href={`mailto:${resource.email}`} className="text-blue-600 hover:underline">
                                      {resource.email}
                                    </a>
                                  </p>
                                )}
                                
                                {resource.matters && (
                                  <p className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded inline-block mt-1">
                                    {resource.matters}
                                  </p>
                                )}
                              </div>
                              
                              {resource.description && (
                                <p className="text-sm text-gray-600 mt-3 border-t border-gray-100 pt-2">
                                  {resource.description}
                                </p>
                              )}
                            </div>
                            
                            {resource.category && (
                              <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full ml-2 whitespace-nowrap">
                                {category === 'legal' 
                                  ? 'Legal Support'
                                  : category.replace(/([A-Z])/g, ' $1').trim()}
                              </span>
                            )}
                          </div>
                          
                          {resource.notes && (
                            <div className="mt-3 text-xs bg-yellow-50 text-yellow-800 p-3 rounded-md flex items-start gap-2 border border-yellow-100">
                              <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-yellow-600" />
                              <span>{resource.notes}</span>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                
                {/* Resource Cards Interaction Guide */}
                {activeResources && activeResources.length > 0 && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100 text-xs text-blue-700">
                    <div className="flex items-start gap-2">
                      <Info className="w-4 h-4 text-blue-500 mt-0.5" />
                      {/* <div>
                        <p className="font-medium mb-1">How to use these resources:</p>
                        <ul className="list-disc pl-4 space-y-1">
                          <li>Click phone numbers to call directly</li>
                          <li>Click email addresses to send a message</li>
                          <li>Resources are filtered based on your form responses</li>
                          <li>You can always return to this list later</li>
                        </ul>
                      </div> */}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}