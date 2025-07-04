import React, { useState, useEffect } from 'react';
import { User, Shield, DollarSign, BriefcaseIcon, FileText, Search, Scale, Filter, Layers, Phone, Mail, Tag, MapPin, Globe, Info, AlertTriangle, ChevronDown, Grid, List, BookOpen, House, AlertCircle } from 'lucide-react';

const AdditionalResources = ({ resources, lang }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [view, setView] = useState('grid');
  const [sortBy, setSortBy] = useState('name');

  const ICONS = {
    AlertCircle,
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

  // Combine all resources
  const allResources = [
    ...resources.steps[0].fields, 
    ...resources.steps[1].fields, 
    ...resources.steps[2].fields,
    ...resources.steps[3].fields
  ];

  const [totalResources, setResources] = useState(allResources);

  // Filter resources based on search term and category
  const filteredResources = totalResources.filter(resource => 
     (selectedCategory === 'all' || 
     resource.category.toLowerCase().includes(selectedCategory.toLowerCase())) &&
    (resource.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (resource.description && resource.description.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  // Sort resources
  const sortedResources = [...filteredResources].sort((a, b) => {
    if (sortBy === 'name') {
     return a.name.localeCompare(b.name);
    } else if (sortBy === 'category') {
      return a.category.localeCompare(b.category);
    }
    return 0;
  });


  const categories = [
    { name: 'First Nations', icon: "Info", nameFR: "Premières Nations" },
    { name: 'Legal And Referral Services',  icon: "Scale", nameFR: "Services Juridiques" },
    { name: 'Rehabilitation',  icon: "BookOpen", nameFR: "Réhabilitation" },
    { name: 'Shelters', icon: "House", nameFR: "Abris" }
  ];

  const [resourceCategories, setCategories] = useState(categories); 

  useEffect(() => {
      async function fetchResourceData() {
          const res = await fetch('/api/resource')
          .then(res => res.json())
          .then(data => {
            if (data[data.length-1].steps) {
              const steps = data[data.length - 1].steps;
              setCategories(steps);
              setResources(steps.flatMap(step => Array.isArray(step.fields) ? step.fields : []));
            } else {
              console.error('No field steps in response');
            }
          })
          .catch(err => console.error('Failed to fetch data:', err));
        }
      fetchResourceData();
    }, [ ]);

  type IconName = keyof typeof ICONS;
  // Get category icon by name
  const getCategoryIcon = (categoryName) => {
    const category = resourceCategories.find(c => c.name === categoryName);
    const iconKey = category?.icon;
    
    const IconComponent =
    iconKey && iconKey in ICONS
      ? ICONS[iconKey as IconName] 
      : Filter;

    return <IconComponent className="w-4 h-4" />;
  };

  // Reset all filters
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSortBy('name');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-2">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
      <div className="h-2 bg-gradient-to-r from-blue-600 via-red-500 to-blue-600 w-full"></div>
        <div className="px-6 py-8 text-center">
          <h1 className="text-3xl font-semibold text-blue-800 mb-3">
            {lang === "fr" ? "Ressources de soutien" : "Support Resources"}
          </h1>
          <p className="text-gray-600 max-w-2.5xl mx-auto">
            {lang === "fr" ? "Trouvez les services de soutien disponibles au Nouveau-Brunswick. Utilisez la barre de recherche et les filtres pour localiser des ressources spécifiques." : "Find support services available in New Brunswick. Use the search bar and filters to locate specific resources."}
          </p>
        </div>
      </div>
      
      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto relative">
          <input 
            type="text" 
            placeholder= {lang === "fr" ? "Rechercher par nom, description ou services offerts..." : "Search by name, description, or services offered..."}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-5 py-4 pl-12 bg-white/50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          
          {searchTerm && (
            <button 
              onClick={() => setSearchTerm('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
            >
              ✕
            </button>
          )}
        </div>

        <div className="flex flex-col md:flex-row justify-between gap-4">
          {/* Category Filters */}
          <div className="flex flex-wrap justify-center md:justify-start gap-2">
            {resourceCategories.map((category) => (
              <button 
                key={category.name}
                onClick={() => setSelectedCategory(category.name)}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-lg text-sm
                  transition-all duration-200 border
                  ${selectedCategory === category.name 
                    ? 'bg-blue-50 text-blue-700 border-blue-200 font-medium' 
                    : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'}
                `}
              >
                {getCategoryIcon(category.icon)}
                {lang === "fr" ? category.nameFR : category.name}
              </button>
            ))}
          </div>

          {/* View and Sort Controls */}
          <div className="flex items-center justify-center md:justify-end gap-2">
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              <button
                onClick={() => setView('grid')}
                className={`p-2 ${view === 'grid' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-500'}`}
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setView('list')}
                className={`p-2 ${view === 'list' ? 'bg-blue-50 text-blue-600' : 'bg-white text-gray-500'}`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="border border-gray-200 rounded-lg p-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="name">{lang === "fr" ? "Trier par nom" : "Sort by Name"}</option>
              <option value="category">{lang === "fr" ? "Trier par catégorie" : "Sort by Category"}</option>
            </select>
          </div>
        </div>

        {/* Filter Status */}
        <div className="flex items-center justify-between">          
          {(selectedCategory !== 'all' || searchTerm) && (
            <button
              onClick={resetFilters}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              {lang === "fr" ? "Réinitialiser les filtres" : "Reset filters"}
            </button>
          )}
        </div>
      </div>

      {/* Resources Display */}
      {sortedResources.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
          <AlertTriangle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">No resources found</h3>
          <p className="text-gray-500 max-w-md mx-auto">
            {lang === "fr" ? "Aucune ressource trouvée correspondant à vos critères de recherche." : "We couldn't find any resources matching your search criteria. Try adjusting your filters or search term."}
          </p>
          <button
            onClick={resetFilters}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {lang === "fr" ? "Réinitialiser tous les filtres" : "Reset all filters"}
          </button>
        </div>
      ) : (
        <>
          {view === 'grid' ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedResources.map((resource, index) => (
                <ResourceCard key={index} resource={resource} getCategoryIcon={getCategoryIcon} lang={lang} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {sortedResources.map((resource, index) => (
                <ResourceListItem key={index} resource={resource} getCategoryIcon={getCategoryIcon} lang={lang} />
              ))}
            </div>
          )}
        </>
      )}

      {/* Resource Count */}
      {sortedResources.length > 0 && (
        <div className="mt-8 text-center text-sm text-gray-500">
          {lang === "fr" ? "Fin des résultats •" : "End of results •"} {sortedResources.length} {lang === "fr" ? "ressources trouvées" : "resources found"}
        </div>
      )}
    </div>
  );
};

// Resource Card Component
const ResourceCard = ({ resource, getCategoryIcon, lang }) => {

  return (
    <div className="overflow-hidden bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg hover:border-blue-200 transition-all duration-300 flex flex-col h-full">
      {/* Category Badge */}
      <div className="flex justify-between items-start mb-3">
        <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs flex items-center gap-1">
          {getCategoryIcon(resource.category)}
          {lang === "fr" ? 
          resource.categoryFR.replace(/([A-Z])/g, ' $1').trim() :
          resource.category.replace(/([A-Z])/g, ' $1').trim()}
        </div>
        {resource.emergency && (
          <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium">
              {lang === "fr" ? "Urgence" : "Emergency"}
          </span>
        )}
      </div>

      <h2 className="text-lg font-medium text-gray-900 mb-2">
        {resource.name}
      </h2>
      
      {resource.description && (
        <p className="text-gray-600 mb-4 text-sm flex-grow  transition-all">
          {lang === "fr" ? resource.descriptionFR : resource.description}
        </p>
      )}
      
      <div className="space-y-3 text-sm mt-auto">
        {resource.phoneNumber && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Phone className="w-4 h-4 text-blue-600" />
            </div>
            <a 
              href={`tel:${resource.phoneNumber.replace(/\s+/g, '')}`} 
              className="text-gray-600 hover:text-blue-600 transition-colors"
            >
              {resource.phoneNumber}
            </a>
          </div>
        )}

        {resource.email && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Mail className="w-4 h-4 text-blue-600" />
            </div>
            <a 
              href={`mailto:${resource.email}`} 
              className="text-gray-600 hover:text-blue-600 transition-colors truncate"
            >
              {resource.email}
            </a>
          </div>
        )}

      {resource.website && (
          <div className="flex items-center gap-3 truncate overflow-hidden">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <Globe className="w-4 h-4 text-blue-600" />
            </div>
            <a 
              href={`${resource.website}`} 
              className="text-gray-600 hover:text-blue-600 transition-colors truncate"
            >
              {resource.website}
            </a>
          </div>
        )}
        
        {resource.location && (
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <MapPin className="w-4 h-4 text-blue-600" />
            </div>
            <span className="text-gray-600">{resource.location}</span>
          </div>
        )}
      </div>

      {resource.notes && (
        <div className="mt-4 border-t border-blue-200">
          <div className="text-xs bg-gray-50 text-gray-700 p-2 rounded-md flex items-start gap-2">
            <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500" />
            <span>{lang === "fr" ? resource.notesFR : resource.notes}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Resource List Item Component
const ResourceListItem = ({ resource, getCategoryIcon, lang }) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-200 transition-all duration-300">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-xs flex items-center gap-1">
              {getCategoryIcon(resource.category)}
              {lang === "fr" ? 
              resource.categoryFR.replace(/([A-Z])/g, ' $1').trim() :
              resource.category.replace(/([A-Z])/g, ' $1').trim()}
            </div>
            
            {resource.emergency && (
              <span className="px-3 py-1 bg-red-50 text-red-700 rounded-full text-xs font-medium">
                {lang === "fr" ? "Urgence" : "Emergency"}
              </span>
            )}
          </div>
          
          <h3 className="text-lg font-medium text-gray-900">
            {resource.name}
          </h3>
          
          {resource.description && !expanded && (
            <p className="text-gray-600 text-sm line-clamp-1 mt-1">
              {lang === "fr" ? resource.descriptionFR : resource.description}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-4">
        {resource.website && (
            <a 
              href={`${resource.website}`} 
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              <Globe className="w-4 h-4" />
              <span className="hidden md:inline text-sm truncate max-w-[150px]">
                {resource.website}
              </span>
            </a>
          )}
          
          {resource.email && (
            <a 
              href={`mailto:${resource.email}`} 
              className="flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              <Mail className="w-4 h-4" />
              <span className="hidden md:inline text-sm truncate max-w-[150px]">
                {resource.email}
              </span>
            </a>
          )}
          
          <button 
            onClick={() => setExpanded(!expanded)}
            className="ml-auto flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600"
          >
            {expanded ? (lang === "fr" ? 'Moins' : 'Less') : (lang === "fr" ? 'Plus' : 'More')}
            <ChevronDown className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>
      
      {/* Expanded Content */}
      {expanded && (
        <div className="mt-4 pt-4 border-t border-gray-100">
          {resource.description && (
            <p className="text-gray-600 text-sm mb-4">
              {lang === "fr" ? resource.descriptionFR : resource.description}
            </p>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resource.phoneNumber && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <Phone className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">{lang === "fr" ? "Numéro de téléphone" : "Phone Number"}</div>
                  <div className="text-sm text-gray-700">{resource.phoneNumber}</div>
                </div>
              </div>
            )}

            
            {resource.location && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <div className="text-xs text-gray-500">{lang === "fr" ? "Emplacement" : "Location"}</div>
                  <div className="text-sm text-gray-700">{resource.location}</div>
                </div>
              </div>
            )}
          </div>
          
          {resource.notes && (
            <div className="mt-4">
              <div className="text-xs bg-gray-50 text-gray-700 p-2 rounded-md flex items-start gap-2">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-500" />
                <span>{lang === "fr" ? resource.notesFR : resource.notes}</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdditionalResources;