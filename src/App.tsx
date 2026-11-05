import React, { useState, useEffect, useRef } from 'react';
import {
  ProjectSnapshot,
  ProjectInfo,
  WastewaterInputs,
  TechnologyUnit,
  ActiveDomain,
  WastewaterTool,
} from './types/ecs';
import {
  SCHEMA_DEFAULTS,
  calculateWastewaterLoads,
  validateWastewaterInputs,
  defaultPumpWellData,
  defaultEqualizationData,
  defaultAerotankData,
  defaultSecondaryClarifierData,
  defaultDisinfectionData,
  defaultAnoxicData,
  defaultSludgeTankData,
  defaultGenericUnitData,
  defaultBarScreenData,
  defaultGritChamberData,
  defaultGreaseTrapData,
  defaultCoagulationData,
  defaultFlocculationData,
  defaultDafData,
  defaultSbrData,
  defaultMbrData,
  defaultMbbrData,
  defaultUasbData,
  defaultChemicalClarifierData,
  defaultSandFilterData,
  defaultFilterPressData,
} from './utils/calculations';
import {
  readProjectsFromStorage,
  writeProjectsToStorage,
  downloadJsonFile,
  makeId,
} from './utils/storage';
import { Header } from './components/Header';
import { StatusBar } from './components/StatusBar';
import { HomePage } from './components/HomePage';
import { ProjectPage } from './components/ProjectPage';
import { DomainSelectionPage } from './components/DomainSelectionPage';
import { WastewaterToolsPage } from './components/WastewaterToolsPage';
import { LoadWorkspace } from './components/LoadWorkspace';
import { TechnologySelectionPage } from './components/TechnologySelectionPage';
import { UnitCardsPage } from './components/UnitCardsPage';
import { UnitDetailPage } from './components/UnitDetailPage';
import { ReportsPage } from './components/ReportsPage';
import { ToolsPage } from './components/ToolsPage';
import { SaveDecisionModal, DeleteConfirmModal, ComingSoonView } from './components/Modals';
import {
  OperationWorkspacePage,
  OperationSubsystem,
  WastewaterOpFeature,
} from './components/operations/OperationWorkspacePage';
import { WaterSupplyDesignPage } from './components/design/WaterSupplyDesignPage';
import { AirEmissionDesignPage } from './components/design/AirEmissionDesignPage';
import { SolidWasteDesignPage } from './components/design/SolidWasteDesignPage';

type PageView =
  | 'home'
  | 'project'
  | 'domains'
  | 'wastewaterTools'
  | 'load'
  | 'technology'
  | 'units'
  | 'unitDetail'
  | 'reports'
  | 'tools'
  | 'waterDesign'
  | 'airDesign'
  | 'solidwasteDesign'
  | 'operations'
  | 'comingSoon';

export default function App() {
  // Navigation & View State
  const [currentView, setCurrentView] = useState<PageView>('home');
  const [selectedDomain, setSelectedDomain] = useState<ActiveDomain>('wastewater');
  const [activeUnitId, setActiveUnitId] = useState<string | null>(null);

  // Storage & Multi-project state
  const [savedProjects, setSavedProjects] = useState<ProjectSnapshot[]>([]);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<string | undefined>(undefined);

  // Project data models
  const [projectInfo, setProjectInfo] = useState<ProjectInfo>({
    name: 'Dự án mới',
    owner: '',
    contact: '',
    location: '',
    designCompany: '',
    designCompanyAddress: '',
    description: '',
    designFields: ['wastewater'],
    projectType: 'Sinh hoạt',
    designBasis: 'Q trung bình ngày',
  });

  const [inputs, setInputs] = useState<WastewaterInputs>(SCHEMA_DEFAULTS);
  const [technologyUnits, setTechnologyUnits] = useState<TechnologyUnit[]>([]);

  // Modals state
  const [saveDecisionOpen, setSaveDecisionOpen] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [projectToDeleteId, setProjectToDeleteId] = useState<string | null>(null);

  // Operation Workspace state
  const [operationSubsystem, setOperationSubsystem] = useState<OperationSubsystem | null>(null);
  const [operationWwFeature, setOperationWwFeature] = useState<string | null>(null);

  const handleOpenOperationHub = (
    subsystem: OperationSubsystem | null = null,
    feature: string | null = null
  ) => {
    setOperationSubsystem(subsystem);
    setOperationWwFeature(feature);
    setCurrentView('operations');
  };

  // Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(
    null
  );

  const fileInputRef = useRef<HTMLInputElement>(null);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3800);
  };

  const REMOVED_UNITS = ['Hố thu gom', 'Hệ thống châm Clo'];
  const sanitizeUnits = (units?: TechnologyUnit[]) =>
    units ? units.filter((u) => !REMOVED_UNITS.includes(u.catalogName)) : [];

  // Initial load from storage and cleanup
  useEffect(() => {
    const list = readProjectsFromStorage();
    setSavedProjects(list);
    setTechnologyUnits((prev) => sanitizeUnits(prev));
  }, []);

  // Calculation results
  const calculationResults = calculateWastewaterLoads(inputs);
  const validationErrors = validateWastewaterInputs(inputs);

  // Dirty state tracking on updates
  const markDirty = () => {
    setIsDirty(true);
  };

  // ----------------- NAVIGATION GUARD -----------------
  const navigateWithGuard = (nextNav: () => void) => {
    if (isDirty) {
      setPendingNavigation(() => nextNav);
      setSaveDecisionOpen(true);
    } else {
      nextNav();
    }
  };

  // ----------------- PROJECT ACTIONS -----------------
  const handleNewProject = () => {
    navigateWithGuard(() => {
      const newId = makeId();
      setCurrentProjectId(newId);
      setProjectInfo({
        name: 'Dự án mới',
        owner: '',
        contact: '',
        location: '',
        designCompany: '',
        designCompanyAddress: '',
        description: '',
        designFields: ['wastewater'],
        projectType: 'Sinh hoạt',
        designBasis: 'Q trung bình ngày',
      });
      setInputs({ ...SCHEMA_DEFAULTS });
      setTechnologyUnits([]);
      setIsDirty(false);
      setCurrentView('project');
      showToast('Đã khởi tạo dự án mới', 'info');
    });
  };

  const handleOpenProject = (id: string) => {
    navigateWithGuard(() => {
      const target = savedProjects.find((p) => p.id === id);
      if (!target) {
        showToast('Không tìm thấy dự án', 'error');
        return;
      }
      setCurrentProjectId(target.id);
      setProjectInfo({
        name: target.project?.name || 'Dự án mới',
        owner: target.project?.owner || '',
        contact: target.project?.contact || '',
        location: target.project?.location || '',
        designCompany: target.project?.designCompany || '',
        designCompanyAddress: target.project?.designCompanyAddress || '',
        description: target.project?.description || '',
        designFields: target.project?.designFields || ['wastewater'],
        projectType: target.project?.projectType || 'Sinh hoạt',
        otherWastewaterType: target.project?.otherWastewaterType || '',
        designBasis: target.project?.designBasis || 'Q trung bình ngày',
      });
      setInputs(target.inputs ? { ...SCHEMA_DEFAULTS, ...target.inputs } : { ...SCHEMA_DEFAULTS });
      setTechnologyUnits(sanitizeUnits(target.technology?.units));
      setIsDirty(false);
      setLastSavedAt(target.updatedAt || target.savedAt);
      setCurrentView('project');
      showToast(`Đã mở dự án "${target.project?.name || 'Dự án'}"`, 'success');
    });
  };

  const handleSaveLocal = (showNotification = true): boolean => {
    const id = currentProjectId || makeId();
    const now = new Date().toISOString();

    const snapshot: ProjectSnapshot = {
      id,
      schemaVersion: 2,
      app: 'ECS — Environmental Calculation System',
      project: projectInfo,
      module: 'wastewater',
      inputs,
      technology: {
        units: technologyUnits,
      },
      savedAt: now,
      updatedAt: now,
    };

    const existingIdx = savedProjects.findIndex((p) => p.id === id);
    let updatedList: ProjectSnapshot[];
    if (existingIdx >= 0) {
      updatedList = [...savedProjects];
      updatedList[existingIdx] = snapshot;
    } else {
      updatedList = [snapshot, ...savedProjects];
    }

    const success = writeProjectsToStorage(updatedList);
    if (success) {
      setSavedProjects(updatedList);
      setCurrentProjectId(id);
      setIsDirty(false);
      setLastSavedAt(now);
      if (showNotification) {
        showToast('Đã lưu dự án thành công trên thiết bị!', 'success');
      }
      return true;
    } else {
      showToast('Không thể lưu vào bộ nhớ trình duyệt', 'error');
      return false;
    }
  };

  const handleExportProject = (id?: string) => {
    const targetId = id || currentProjectId;
    let target = savedProjects.find((p) => p.id === targetId);

    if (!target && currentProjectId) {
      // Export current live project
      target = {
        id: currentProjectId,
        schemaVersion: 2,
        app: 'ECS — Environmental Calculation System',
        project: projectInfo,
        module: 'wastewater',
        inputs,
        technology: { units: technologyUnits },
        savedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    }

    if (!target) {
      showToast('Không có dữ liệu dự án để xuất', 'error');
      return;
    }

    const safeName = (target.project?.name || 'ECS_Project')
      .replace(/[^\p{L}\p{N}_-]+/gu, '_')
      .slice(0, 50);
    downloadJsonFile(`${safeName}.json`, JSON.stringify(target, null, 2));
    showToast('Đã xuất file dự án JSON thành công!', 'success');
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('Định dạng tệp không hợp lệ');
        }

        const newId = makeId();
        const importedProject: ProjectSnapshot = {
          ...parsed,
          id: newId,
          project: {
            ...parsed.project,
            name: parsed.project?.name || file.name.replace(/\.json$/i, '') || 'Dự án nhập',
          },
          inputs: parsed.inputs ? { ...SCHEMA_DEFAULTS, ...parsed.inputs } : { ...SCHEMA_DEFAULTS },
          technology: parsed.technology?.units ? parsed.technology : { units: [] },
          updatedAt: new Date().toISOString(),
        };

        const updated = [importedProject, ...savedProjects];
        writeProjectsToStorage(updated);
        setSavedProjects(updated);

        // Load into state
        setCurrentProjectId(newId);
        setProjectInfo(importedProject.project);
        setInputs(importedProject.inputs);
        setTechnologyUnits(sanitizeUnits(importedProject.technology?.units));
        setIsDirty(false);
        setCurrentView('wastewaterTools');
        showToast('Đã nhập và mở dự án thành công!', 'success');
      } catch (err: any) {
        showToast('Lỗi khi đọc file JSON: ' + (err?.message || 'Tệp hỏng'), 'error');
      }
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsText(file);
  };

  const handleRequestDeleteProject = (id: string) => {
    setProjectToDeleteId(id);
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (!projectToDeleteId) return;
    const remaining = savedProjects.filter((p) => p.id !== projectToDeleteId);
    writeProjectsToStorage(remaining);
    setSavedProjects(remaining);

    if (currentProjectId === projectToDeleteId) {
      setCurrentProjectId(null);
      setIsDirty(false);
      setCurrentView('home');
    }
    setDeleteConfirmOpen(false);
    setProjectToDeleteId(null);
    showToast('Đã xóa dự án khỏi thiết bị', 'info');
  };

  // ----------------- TECHNOLOGY UNITS ACTIONS -----------------
  const handleAddUnit = (catalogName: string) => {
    markDirty();
    const existing = technologyUnits.map((u) => u.name);
    let candidateName = catalogName;
    if (existing.includes(candidateName)) {
      let counter = 2;
      while (existing.includes(`${catalogName} ${counter}`)) counter++;
      candidateName = `${catalogName} ${counter}`;
    }

    const newUnit: TechnologyUnit = {
      id: `unit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      catalogName,
      name: candidateName,
      status: 'pending',
      data: {
        pumpWell: catalogName === 'Hầm bơm' ? defaultPumpWellData(calculationResults.qh) : undefined,
        equalizationTank:
          catalogName === 'Bể điều hòa'
            ? defaultEqualizationData(calculationResults.qHour)
            : undefined,
        aerotank:
          catalogName === 'Bể Aerotank'
            ? defaultAerotankData(calculationResults.q, inputs.bod)
            : undefined,
        secondaryClarifier:
          catalogName === 'Bể lắng sinh học'
            ? defaultSecondaryClarifierData(calculationResults.qh, 3000)
            : undefined,
        disinfectionTank:
          catalogName === 'Bể khử trùng'
            ? defaultDisinfectionData(calculationResults.qh)
            : undefined,
        anoxicTank:
          catalogName === 'Bể Anoxic'
            ? defaultAnoxicData(calculationResults.qHour)
            : undefined,
        sludgeTank:
          ['Bể chứa bùn', 'Bể nén bùn'].includes(catalogName)
            ? defaultSludgeTankData(null)
            : undefined,
        barScreen:
          catalogName === 'Song chắn rác'
            ? defaultBarScreenData(calculationResults.qh)
            : undefined,
        gritChamber:
          catalogName === 'Bể lắng cát'
            ? defaultGritChamberData(calculationResults.qh)
            : undefined,
        greaseTrap:
          catalogName === 'Bể tách dầu mỡ'
            ? defaultGreaseTrapData(calculationResults.qh)
            : undefined,
        coagulationTank:
          ['Bể keo tụ', 'Bể phản ứng'].includes(catalogName)
            ? defaultCoagulationData(calculationResults.qh)
            : undefined,
        flocculationTank:
          catalogName === 'Bể tạo bông'
            ? defaultFlocculationData(calculationResults.qh)
            : undefined,
        daf:
          catalogName === 'Bể tuyển nổi DAF'
            ? defaultDafData(calculationResults.qh)
            : undefined,
        sbr:
          catalogName === 'Bể SBR'
            ? defaultSbrData(calculationResults.q, inputs.bod)
            : undefined,
        mbr:
          catalogName === 'Bể MBR'
            ? defaultMbrData(calculationResults.qh)
            : undefined,
        mbbr:
          catalogName === 'Bể MBBR'
            ? defaultMbbrData(calculationResults.qh, inputs.bod)
            : undefined,
        uasb:
          catalogName === 'Bể UASB'
            ? defaultUasbData(calculationResults.q, inputs.cod)
            : undefined,
        chemicalClarifier:
          catalogName === 'Bể lắng hóa lý'
            ? defaultChemicalClarifierData(calculationResults.qh)
            : undefined,
        sandFilter:
          ['Bể lọc áp lực', 'Lọc than hoạt tính'].includes(catalogName)
            ? defaultSandFilterData(calculationResults.qh, catalogName === 'Lọc than hoạt tính' ? 'carbon' : 'sand')
            : undefined,
        filterPress:
          catalogName === 'Máy ép bùn'
            ? defaultFilterPressData(null)
            : undefined,
        genericUnit:
          ![
            'Hầm bơm', 'Bể điều hòa', 'Bể Aerotank', 'Bể lắng sinh học', 'Bể khử trùng', 'Bể Anoxic',
            'Bể chứa bùn', 'Bể nén bùn', 'Song chắn rác', 'Bể lắng cát', 'Bể tách dầu mỡ', 'Bể phản ứng', 'Bể keo tụ', 'Bể tạo bông',
            'Bể tuyển nổi DAF', 'Bể SBR', 'Bể MBR', 'Bể MBBR', 'Bể UASB', 'Bể lắng hóa lý', 'Bể lọc áp lực', 'Lọc than hoạt tính', 'Máy ép bùn'
          ].includes(catalogName)
            ? defaultGenericUnitData(catalogName, calculationResults.qh, calculationResults.q)
            : undefined,
      },
    };

    const next = [...technologyUnits, newUnit];
    setTechnologyUnits(next);
  };

  const handleRemoveCatalogType = (catalogName: string) => {
    markDirty();
    setTechnologyUnits((prev) => prev.filter((u) => u.catalogName !== catalogName));
  };

  const handleRemoveUnit = (id: string) => {
    markDirty();
    setTechnologyUnits((prev) => prev.filter((u) => u.id !== id));
  };

  const handleDuplicateUnit = (unit: TechnologyUnit) => {
    markDirty();
    const existing = technologyUnits.map((u) => u.name);
    let counter = 2;
    let candidate = `${unit.name} (bản sao)`;
    while (existing.includes(candidate)) {
      candidate = `${unit.name} (bản sao ${counter})`;
      counter++;
    }

    const clone: TechnologyUnit = {
      ...unit,
      id: `unit_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: candidate,
      data: JSON.parse(JSON.stringify(unit.data || {})),
    };
    setTechnologyUnits((prev) => [...prev, clone]);
    showToast(`Đã nhân đôi "${unit.name}"`, 'success');
  };

  const handleRenameUnit = (id: string, newName: string) => {
    markDirty();
    setTechnologyUnits((prev) =>
      prev.map((u) => (u.id === id ? { ...u, name: newName } : u))
    );
  };

  const handleUpdateUnitData = (unitId: string, updatedData: any, status: 'pending' | 'done') => {
    markDirty();
    setTechnologyUnits((prev) =>
      prev.map((u) => (u.id === unitId ? { ...u, data: updatedData, status } : u))
    );
  };

  // ----------------- DOMAIN SELECTION -----------------
  const handleSelectDomain = (domain: ActiveDomain | 'domains') => {
    if (domain === 'domains') {
      setCurrentView('domains');
      return;
    }
    setSelectedDomain(domain);
    if (domain === 'wastewater') {
      setCurrentView('wastewaterTools');
    } else if (domain === 'water') {
      setCurrentView('waterDesign');
    } else if (domain === 'air') {
      setCurrentView('airDesign');
    } else if (domain === 'solidwaste') {
      setCurrentView('solidwasteDesign');
    }
  };

  const domainRoadmapDetails: Record<string, { title: string; icon: string; desc: string }> = {
    water: {
      title: 'Nước cấp',
      icon: '💧',
      desc: 'Phân hệ tính toán trạm xử lý nước cấp, bể trộn thủy lực, keo tụ tạo bông, lắng lamen, bể lọc cát nhanh và trạm bơm cấp nước sinh hoạt/công nghiệp.',
    },
    air: {
      title: 'Khí thải',
      icon: '〰',
      desc: 'Phân hệ tính toán lưu lượng khí thải phát sinh, đường kính ống hút, tổn thất áp lực, tháp hấp thụ dạng đệm và hệ thống lọc bụi túi vải.',
    },
    solidwaste: {
      title: 'Chất thải rắn',
      icon: '▤',
      desc: 'Phân hệ tính toán phát sinh rác thải đô thị và công nghiệp, quy mô bãi chôn lấp hợp vệ sinh, nhà máy ủ phân compost và lò đốt rác.',
    },
  };

  // Find active unit for unitDetail view
  const activeUnit = technologyUnits.find((u) => u.id === activeUnitId);

  return (
    <div className="min-h-screen bg-[#f2f6f3] text-[#20342b] font-sans flex flex-col selection:bg-[#176b45] selection:text-white">
      {/* Hidden file input for JSON import */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImportFile}
        accept=".json,application/json"
        className="hidden"
      />

      {/* Header with Titlebar and Dropdown Menus */}
      <Header
        currentProjectName={projectInfo.name}
        hasActiveProject={!!currentProjectId}
        onNavigateHome={() => navigateWithGuard(() => setCurrentView('home'))}
        onNewProject={handleNewProject}
        onOpenProjectDetails={() => setCurrentView('project')}
        onSaveLocal={() => handleSaveLocal(true)}
        onImportClick={() => fileInputRef.current?.click()}
        onExportClick={() => handleExportProject()}
        onExitApp={() => {
          navigateWithGuard(() => {
            showToast('Bạn có thể đóng tab trình duyệt để thoát', 'info');
          });
        }}
        onSelectDomain={handleSelectDomain}
        onOpenOperationHub={handleOpenOperationHub}
        currentView={currentView}
      />

      {/* Main View Router */}
      <main className="flex-1 pb-12">
        {currentView === 'home' && (
          <HomePage
            savedProjects={savedProjects}
            onNewProject={handleNewProject}
            onImportClick={() => fileInputRef.current?.click()}
            onOpenProject={handleOpenProject}
            onExportProject={handleExportProject}
            onDeleteProject={handleRequestDeleteProject}
            onSelectDomain={handleSelectDomain}
            hasActiveProject={!!currentProjectId}
            activeProjectName={projectInfo.name}
            onContinueProject={() => setCurrentView('domains')}
            onOpenProjectDetails={() => setCurrentView('project')}
          />
        )}

        {currentView === 'project' && (
          <ProjectPage
            projectInfo={projectInfo}
            isNewProject={!savedProjects.some((p) => p.id === currentProjectId)}
            onUpdateField={(field, val) => {
              markDirty();
              setProjectInfo((prev) => ({ ...prev, [field]: val }));
            }}
            onSaveProject={() => handleSaveLocal(true)}
            onStartDesign={() => setCurrentView('domains')}
          />
        )}

        {currentView === 'domains' && (
          <DomainSelectionPage
            onSelectDomain={handleSelectDomain}
            onBackToProject={() => setCurrentView('project')}
          />
        )}

        {currentView === 'wastewaterTools' && (
          <WastewaterToolsPage
            onSelectTool={(tool: WastewaterTool) => {
              if (tool === 'load') setCurrentView('load');
              else if (tool === 'technology') setCurrentView('technology');
              else if (tool === 'units') setCurrentView('units');
              else if (tool === 'reports') setCurrentView('reports');
              else if (tool === 'tools') setCurrentView('tools');
            }}
            onBackToDomains={() => setCurrentView('domains')}
            selectedUnitsCount={technologyUnits.length}
          />
        )}

        {currentView === 'load' && (
          <LoadWorkspace
            inputs={inputs}
            projectType={projectInfo.projectType}
            otherWastewaterType={projectInfo.otherWastewaterType}
            onUpdateInput={(key, val) => {
              markDirty();
              setInputs((prev) => ({ ...prev, [key]: val }));
            }}
            onUpdateProjectType={(type, otherName) => {
              markDirty();
              setProjectInfo((prev) => ({
                ...prev,
                projectType: type,
                otherWastewaterType: otherName,
              }));
            }}
            results={calculationResults}
            validationErrors={validationErrors}
            onBack={() => setCurrentView('wastewaterTools')}
          />
        )}

        {currentView === 'technology' && (
          <TechnologySelectionPage
            units={technologyUnits}
            onAddUnit={handleAddUnit}
            onRemoveCatalogType={handleRemoveCatalogType}
            onRemoveUnit={handleRemoveUnit}
            onDuplicateUnit={handleDuplicateUnit}
            onRenameUnit={handleRenameUnit}
            onBack={() => setCurrentView('wastewaterTools')}
          />
        )}

        {currentView === 'units' && (
          <UnitCardsPage
            units={technologyUnits}
            onOpenUnit={(id) => {
              setActiveUnitId(id);
              setCurrentView('unitDetail');
            }}
            onGoToTechnology={() => setCurrentView('technology')}
            onBack={() => setCurrentView('wastewaterTools')}
          />
        )}

        {currentView === 'unitDetail' && activeUnit && (
          <UnitDetailPage
            unit={activeUnit}
            qPeakHour={calculationResults.qh}
            qAverageDay={calculationResults.q}
            bodIn={inputs.bod}
            codIn={inputs.cod}
            onUpdateUnitData={handleUpdateUnitData}
            onBack={() => setCurrentView('units')}
          />
        )}

        {currentView === 'reports' && (
          <ReportsPage
            project={projectInfo}
            inputs={inputs}
            results={calculationResults}
            units={technologyUnits}
            onBack={() => setCurrentView('wastewaterTools')}
          />
        )}

        {currentView === 'tools' && (
          <ToolsPage
            onBack={() => setCurrentView('wastewaterTools')}
            currentQavg={calculationResults.q}
            currentBod={inputs.bod}
            currentTn={inputs.tn}
            currentTp={inputs.tp}
          />
        )}

        {currentView === 'waterDesign' && (
          <WaterSupplyDesignPage
            onBackToDomains={() => setCurrentView('domains')}
            projectName={projectInfo.name}
          />
        )}

        {currentView === 'airDesign' && (
          <AirEmissionDesignPage
            onBackToDomains={() => setCurrentView('domains')}
            projectName={projectInfo.name}
          />
        )}

        {currentView === 'solidwasteDesign' && (
          <SolidWasteDesignPage
            onBackToDomains={() => setCurrentView('domains')}
            projectName={projectInfo.name}
          />
        )}

        {currentView === 'comingSoon' && (
          <ComingSoonView
            title={domainRoadmapDetails[selectedDomain]?.title || 'Chuyên ngành'}
            icon={domainRoadmapDetails[selectedDomain]?.icon || '🛠'}
            description={
              domainRoadmapDetails[selectedDomain]?.desc ||
              'Chức năng này đã được định hình trong kiến trúc ECS và sẽ được phát triển ở phiên bản tiếp theo.'
            }
            onBackToDomains={() => setCurrentView('domains')}
            onBackToProject={() => setCurrentView('project')}
          />
        )}

        {currentView === 'operations' && (
          <OperationWorkspacePage
            onBackToHome={() => setCurrentView('home')}
            designFlowM3Day={calculationResults.q}
            designBodMgL={inputs.bod}
            designCodMgL={inputs.cod}
            designTnMgL={inputs.tn}
            designTpMgL={inputs.tp}
            designAlkalinityMgL={inputs.alkalinity}
            initialSubsystem={operationSubsystem}
            initialFeature={operationWwFeature}
          />
        )}
      </main>

      {/* Persistent Bottom Status Bar */}
      <StatusBar
        currentProjectName={projectInfo.name}
        hasActiveProject={!!currentProjectId}
        isDirty={isDirty}
        lastSavedAt={lastSavedAt}
      />

      {/* Save Decision Dialog */}
      <SaveDecisionModal
        isOpen={saveDecisionOpen}
        onSave={() => {
          handleSaveLocal(false);
          setSaveDecisionOpen(false);
          if (pendingNavigation) pendingNavigation();
        }}
        onDiscard={() => {
          setIsDirty(false);
          setSaveDecisionOpen(false);
          if (pendingNavigation) pendingNavigation();
        }}
        onCancel={() => {
          setSaveDecisionOpen(false);
          setPendingNavigation(null);
        }}
      />

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmModal
        isOpen={deleteConfirmOpen}
        projectName={
          savedProjects.find((p) => p.id === projectToDeleteId)?.project?.name || 'Dự án này'
        }
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setDeleteConfirmOpen(false);
          setProjectToDeleteId(null);
        }}
      />

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          className={`fixed top-4 right-4 z-50 px-4 py-3 rounded-xl text-white font-semibold text-xs shadow-lg flex items-center gap-2.5 transition-all transform animate-slideDown ${
            toast.type === 'error'
              ? 'bg-red-700'
              : toast.type === 'info'
              ? 'bg-[#204030]'
              : 'bg-[#176b45]'
          }`}
        >
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
