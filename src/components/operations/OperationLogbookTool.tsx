import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  Trash2,
  Download,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  FileSpreadsheet,
  Activity,
  Edit2,
  X,
  Search,
} from 'lucide-react';
import { formatNumber, getDecimalDigits } from '../../utils/calculations';
import { NumericInput } from '../common/NumericInput';
import { OperationLogEntry, evaluateSVI } from '../../utils/operationCalculations';

interface OperationLogbookToolProps {
  onBack: () => void;
  designFlowM3Day?: number;
}

const STORAGE_KEY = 'ecs_operation_logs';

export const OperationLogbookTool: React.FC<OperationLogbookToolProps> = ({
  onBack,
  designFlowM3Day = 100,
}) => {
  const precision = getDecimalDigits();

  // Logs list
  const [logs, setLogs] = useState<OperationLogEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {}
    // Initial sample seed if completely empty
    return [
      {
        id: 'log_seed_1',
        date: new Date(Date.now() - 86400000 * 2).toISOString().slice(0, 10),
        shift: 'Ca 1 (Hành chính)',
        operator: 'Kỹ sư Vận hành',
        flowM3Day: designFlowM3Day,
        inletPh: 7.2,
        aerotankPh: 7.4,
        doMgL: 2.8,
        mlssMgL: 3200,
        sv30MlL: 310,
        sviMlG: 97,
        sviStatus: 'optimal',
        sviStatusText: 'Bông bùn tối ưu, kết tụ đặc chắc, lắng tốt',
        clarityCm: 45,
        codInMgL: 480,
        codOutMgL: 38,
        codEfficiencyPercent: 92.1,
        nh4InMgL: 28.5,
        nh4OutMgL: 1.8,
        nh4EfficiencyPercent: 93.7,
        sludgeWastedM3Day: 4.5,
        powerKwh: 125,
        chemicalNotes: 'Châm 4.2 kg NaHCO3, 1.5 kg Urê',
        maintenanceNotes: 'Bơm nước thải chìm P-01 và máy thổi khí B-01 hoạt động êm.',
      },
      {
        id: 'log_seed_2',
        date: new Date(Date.now() - 86400000).toISOString().slice(0, 10),
        shift: 'Ca 1 (Hành chính)',
        operator: 'Kỹ sư Vận hành',
        flowM3Day: designFlowM3Day * 1.05,
        inletPh: 7.0,
        aerotankPh: 7.3,
        doMgL: 2.5,
        mlssMgL: 3350,
        sv30MlL: 340,
        sviMlG: 101,
        sviStatus: 'optimal',
        sviStatusText: 'Bông bùn kết tụ tốt, nước sau lắng trong',
        clarityCm: 48,
        codInMgL: 510,
        codOutMgL: 42,
        codEfficiencyPercent: 91.8,
        nh4InMgL: 31.0,
        nh4OutMgL: 2.1,
        nh4EfficiencyPercent: 93.2,
        sludgeWastedM3Day: 5.0,
        powerKwh: 130,
        chemicalNotes: 'Châm 5.0 kg NaHCO3, 2.0 kg Urê',
        maintenanceNotes: 'Vệ sinh song chắn rác thô đầu vào.',
      },
    ];
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<OperationLogEntry>>({
    date: new Date().toISOString().slice(0, 10),
    shift: 'Ca 1 (Hành chính)',
    operator: 'Kỹ sư Vận hành',
    flowM3Day: designFlowM3Day,
    inletPh: 7.0,
    aerotankPh: 7.2,
    doMgL: 2.5,
    mlssMgL: 3000,
    sv30MlL: 300,
    clarityCm: 45,
    codInMgL: 500,
    codOutMgL: 40,
    nh4InMgL: 30,
    nh4OutMgL: 2,
    sludgeWastedM3Day: 5,
    powerKwh: 120,
    chemicalNotes: '',
    maintenanceNotes: '',
  });

  // Persist to storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(logs));
    } catch {}
  }, [logs]);

  // Live SVI calculation for form
  const liveSvi = evaluateSVI(Number(formData.sv30MlL) || 0, Number(formData.mlssMgL) || 0);

  const handleOpenNew = () => {
    setEditingId(null);
    setFormData({
      date: new Date().toISOString().slice(0, 10),
      shift: 'Ca 1 (Hành chính)',
      operator: 'Kỹ sư Vận hành',
      flowM3Day: designFlowM3Day,
      inletPh: 7.1,
      aerotankPh: 7.3,
      doMgL: 2.6,
      mlssMgL: 3200,
      sv30MlL: 320,
      clarityCm: 45,
      codInMgL: 500,
      codOutMgL: 40,
      nh4InMgL: 30,
      nh4OutMgL: 2,
      sludgeWastedM3Day: 5,
      powerKwh: 120,
      chemicalNotes: '',
      maintenanceNotes: '',
    });
    setModalOpen(true);
  };

  const handleEdit = (entry: OperationLogEntry) => {
    setEditingId(entry.id);
    setFormData(entry);
    setModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Xác nhận xóa nhật ký ngày này?')) {
      setLogs((prev) => prev.filter((item) => item.id !== id));
    }
  };

  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();
    const mlss = Number(formData.mlssMgL) || 0;
    const sv30 = Number(formData.sv30MlL) || 0;
    const sviEval = evaluateSVI(sv30, mlss);

    const codIn = Number(formData.codInMgL) || 0;
    const codOut = Number(formData.codOutMgL) || 0;
    const codEff = codIn > 0 ? Math.max(0, ((codIn - codOut) / codIn) * 100) : 0;

    const nh4In = Number(formData.nh4InMgL) || 0;
    const nh4Out = Number(formData.nh4OutMgL) || 0;
    const nh4Eff = nh4In > 0 ? Math.max(0, ((nh4In - nh4Out) / nh4In) * 100) : 0;

    const entry: OperationLogEntry = {
      id: editingId || `log_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      date: formData.date || new Date().toISOString().slice(0, 10),
      shift: formData.shift || 'Ca 1',
      operator: formData.operator || 'Kỹ sư',
      flowM3Day: Number(formData.flowM3Day) || 0,
      inletPh: Number(formData.inletPh) || 7,
      aerotankPh: Number(formData.aerotankPh) || 7,
      doMgL: Number(formData.doMgL) || 2,
      mlssMgL: mlss,
      sv30MlL: sv30,
      sviMlG: sviEval.svi,
      sviStatus: sviEval.status,
      sviStatusText: sviEval.text,
      clarityCm: Number(formData.clarityCm) || 0,
      codInMgL: codIn,
      codOutMgL: codOut,
      codEfficiencyPercent: codEff,
      nh4InMgL: nh4In,
      nh4OutMgL: nh4Out,
      nh4EfficiencyPercent: nh4Eff,
      sludgeWastedM3Day: Number(formData.sludgeWastedM3Day) || 0,
      powerKwh: Number(formData.powerKwh) || 0,
      chemicalNotes: formData.chemicalNotes || '',
      maintenanceNotes: formData.maintenanceNotes || '',
    };

    if (editingId) {
      setLogs((prev) => prev.map((item) => (item.id === editingId ? entry : item)));
    } else {
      setLogs((prev) => [entry, ...prev]);
    }
    setModalOpen(false);
  };

  const handleExportCSV = () => {
    if (logs.length === 0) return;
    const headers = [
      'Ngày',
      'Ca trực',
      'Kỹ sư',
      'Lưu lượng Q (m3/d)',
      'pH vào',
      'pH Aerotank',
      'DO (mg/L)',
      'MLSS (mg/L)',
      'SV30 (mL/L)',
      'SVI (mL/g)',
      'Trạng thái SVI',
      'Độ trong (cm)',
      'COD vào (mg/L)',
      'COD ra (mg/L)',
      'Hiệu suất COD (%)',
      'NH4 vào (mg/L)',
      'NH4 ra (mg/L)',
      'Bùn xả Qw (m3/d)',
      'Điện năng (kWh)',
      'Hóa chất châm',
      'Ghi chú thiết bị',
    ];

    const rows = logs.map((l) => [
      l.date,
      `"${l.shift}"`,
      `"${l.operator}"`,
      l.flowM3Day,
      l.inletPh,
      l.aerotankPh,
      l.doMgL,
      l.mlssMgL,
      l.sv30MlL,
      l.sviMlG,
      `"${l.sviStatusText}"`,
      l.clarityCm,
      l.codInMgL,
      l.codOutMgL,
      l.codEfficiencyPercent.toFixed(1),
      l.nh4InMgL,
      l.nh4OutMgL,
      l.sludgeWastedM3Day,
      l.powerKwh,
      `"${l.chemicalNotes.replace(/"/g, '""')}"`,
      `"${l.maintenanceNotes.replace(/"/g, '""')}"`,
    ]);

    const csvContent =
      '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ECS_NhatKyVanHanh_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const filteredLogs = logs.filter(
    (l) =>
      l.date.includes(searchTerm) ||
      l.operator.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.chemicalNotes.toLowerCase().includes(searchTerm.toLowerCase()) ||
      l.maintenanceNotes.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#dce7e1]">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg border border-[#cfdcd4] bg-white hover:bg-[#edf5f0] text-xs font-semibold text-[#183b2b] transition-colors cursor-pointer shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 text-[#176b45]" />
            <span>Quay lại</span>
          </button>
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#eaf4ee] text-[#176b45] flex items-center justify-center font-bold shrink-0">
              <Activity className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h2 className="font-extrabold text-sm sm:text-base text-[#183b2b] truncate sm:whitespace-normal">Nhật ký Vận hành Hệ thống Nước thải</h2>
              <p className="text-[11px] sm:text-xs text-[#667a6e] line-clamp-1 sm:line-clamp-none">
                Ghi nhận chỉ số hàng ngày, kiểm soát SVI bông bùn, đánh giá DO - MLSS và theo dõi sự cố công trình
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 sm:py-1.5 rounded-lg border border-[#cfdcd4] bg-white hover:bg-[#edf5f0] text-xs font-semibold text-[#183b2b] shadow-xs transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-[#176b45]" />
            <span>Xuất CSV</span>
          </button>
          <button
            type="button"
            onClick={handleOpenNew}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 sm:py-1.5 rounded-lg bg-[#176b45] hover:bg-[#125837] text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm ngày mới</span>
          </button>
        </div>
      </div>

      {/* Filter and stats banner */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="p-3 bg-white rounded-xl border border-[#cfdcd4] shadow-xs">
          <span className="text-[10px] text-[#718779] block">Tổng số ngày ghi nhận</span>
          <strong className="text-xl font-bold font-mono text-[#183b2b]">{logs.length} ngày</strong>
        </div>

        <div className="p-3 bg-white rounded-xl border border-[#cfdcd4] shadow-xs">
          <span className="text-[10px] text-[#718779] block">SVI ngày gần nhất</span>
          {logs.length > 0 ? (
            <div className="flex items-center gap-2 mt-0.5">
              <strong className="text-xl font-bold font-mono text-[#176b45]">{logs[0].sviMlG} mL/g</strong>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                logs[0].sviStatus === 'optimal'
                  ? 'bg-emerald-100 text-emerald-800'
                  : logs[0].sviStatus === 'bulking'
                  ? 'bg-rose-100 text-rose-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {logs[0].sviStatus === 'optimal' ? 'Tối ưu' : logs[0].sviStatus === 'bulking' ? 'Nở bùn!' : 'Bình thường'}
              </span>
            </div>
          ) : (
            <span className="text-xs text-gray-400">Chưa có</span>
          )}
        </div>

        <div className="p-3 bg-white rounded-xl border border-[#cfdcd4] shadow-xs">
          <span className="text-[10px] text-[#718779] block">DO Aerotank gần nhất</span>
          <strong className="text-xl font-bold font-mono text-blue-700">
            {logs.length > 0 ? `${formatNumber(logs[0].doMgL, precision)} mg/L` : '—'}
          </strong>
        </div>

        <div className="p-3 bg-white rounded-xl border border-[#cfdcd4] shadow-xs">
          <span className="text-[10px] text-[#718779] block">Tìm kiếm nhật ký</span>
          <div className="relative mt-1">
            <input
              type="text"
              placeholder="Tìm theo ngày, ghi chú..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-7 pr-2 py-1 text-xs border border-[#cfdcd4] rounded-lg focus:outline-none focus:border-[#176b45]"
            />
            <Search className="w-3.5 h-3.5 text-gray-400 absolute left-2 top-2" />
          </div>
        </div>
      </div>

      {/* Table of logs */}
      <div className="bg-white rounded-xl border border-[#cfdcd4] shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[950px]">
            <thead className="bg-[#f5f8f6] text-[#2c4737] font-bold border-b border-[#cfdcd4]">
              <tr>
                <th className="py-2.5 px-3">Ngày & Ca</th>
                <th className="py-2.5 px-3">Q (m³/d)</th>
                <th className="py-2.5 px-3">pH Vào/Bể</th>
                <th className="py-2.5 px-3">DO (mg/L)</th>
                <th className="py-2.5 px-3">MLSS (mg/L)</th>
                <th className="py-2.5 px-3">SV30 (mL/L)</th>
                <th className="py-2.5 px-3">SVI (mL/g) & Trạng thái</th>
                <th className="py-2.5 px-3">COD Vào / Ra</th>
                <th className="py-2.5 px-3">NH₄⁺ Vào / Ra</th>
                <th className="py-2.5 px-3">Ghi chú & Hóa chất</th>
                <th className="py-2.5 px-3 text-right">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#e8efe9]">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-8 text-center text-gray-400">
                    Chưa có nhật ký nào phù hợp. Hãy bấm "Thêm nhật ký ngày mới" để bắt đầu ghi chép.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((l) => (
                  <tr key={l.id} className="hover:bg-[#fbfdfc] transition-colors">
                    <td className="py-2.5 px-3 font-semibold text-[#183b2b] whitespace-nowrap">
                      <div>{l.date}</div>
                      <div className="text-[10px] text-[#718779]">{l.shift} • {l.operator}</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono font-medium">{formatNumber(l.flowM3Day, precision)}</td>
                    <td className="py-2.5 px-3 font-mono">
                      {formatNumber(l.inletPh, precision)} / <strong className="text-[#176b45]">{formatNumber(l.aerotankPh, precision)}</strong>
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      <span className={`px-1.5 py-0.5 rounded font-bold ${
                        l.doMgL < 2.0 ? 'bg-amber-100 text-amber-800' : 'text-blue-800'
                      }`}>
                        {formatNumber(l.doMgL, precision)}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-mono">{formatNumber(l.mlssMgL, 0)}</td>
                    <td className="py-2.5 px-3 font-mono">{formatNumber(l.sv30MlL, 0)}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5">
                        <strong className="font-mono text-sm">{l.sviMlG}</strong>
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                          l.sviStatus === 'optimal'
                            ? 'bg-emerald-100 text-emerald-800'
                            : l.sviStatus === 'bulking'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {l.sviStatus === 'optimal' ? 'Tốt' : l.sviStatus === 'bulking' ? 'Nở bùn' : 'Bình thường'}
                        </span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      <div>{formatNumber(l.codInMgL, 0)} → {formatNumber(l.codOutMgL, 0)}</div>
                      <div className="text-[10px] text-emerald-700">({formatNumber(l.codEfficiencyPercent, 1)}%)</div>
                    </td>
                    <td className="py-2.5 px-3 font-mono">
                      <div>{formatNumber(l.nh4InMgL, 1)} → {formatNumber(l.nh4OutMgL, 1)}</div>
                      <div className="text-[10px] text-emerald-700">({formatNumber(l.nh4EfficiencyPercent, 1)}%)</div>
                    </td>
                    <td className="py-2.5 px-3 max-w-[220px] truncate text-[#445b4e]" title={`${l.chemicalNotes} | ${l.maintenanceNotes}`}>
                      {l.chemicalNotes || l.maintenanceNotes || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleEdit(l)}
                        className="p-1 text-gray-500 hover:text-[#176b45] rounded hover:bg-gray-100 transition-colors cursor-pointer mr-1"
                        title="Chỉnh sửa nhật ký"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(l.id)}
                        className="p-1 text-gray-400 hover:text-rose-600 rounded hover:bg-gray-100 transition-colors cursor-pointer"
                        title="Xóa nhật ký"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: THÊM / SỬA NHẬT KÝ */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl border border-[#cfdcd4] shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-5 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#e5eee8]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#eaf4ee] text-[#176b45] flex items-center justify-center font-bold">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-[#183b2b]">
                    {editingId ? 'Chỉnh sửa Nhật ký Vận hành' : 'Thêm Nhật ký Vận hành Ngày mới'}
                  </h3>
                  <p className="text-[11px] text-[#718779]">Ghi nhận số liệu phục vụ kiểm soát quy trình xử lý</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="space-y-4 text-xs">
              {/* Thông tin ca trực */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Ngày ghi nhận:</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#cfdcd4]"
                  />
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Ca trực:</label>
                  <select
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#cfdcd4] bg-white"
                  >
                    <option value="Ca 1 (Hành chính)">Ca 1 (Hành chính)</option>
                    <option value="Ca 2 (Chiều)">Ca 2 (Chiều)</option>
                    <option value="Ca 3 (Đêm)">Ca 3 (Đêm)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Kỹ sư vận hành:</label>
                  <input
                    type="text"
                    required
                    value={formData.operator}
                    onChange={(e) => setFormData({ ...formData, operator: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#cfdcd4]"
                  />
                </div>
              </div>

              {/* Thông số thủy lực & bùn sinh học */}
              <div className="p-3 bg-[#f8faf8] rounded-xl border border-[#d6e5dc] space-y-3">
                <div className="font-bold text-xs text-[#183b2b] uppercase tracking-wider">
                  Chỉ số Vi sinh & Bùn hoạt tính (Aerotank)
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[#43594d] font-medium mb-1">Lưu lượng Q (m³/d):</label>
                    <NumericInput
                      value={formData.flowM3Day ?? 0}
                      onChange={(val) => setFormData({ ...formData, flowM3Day: val })}
                      className="w-full px-2 py-1.5 rounded-lg border border-[#cfdcd4] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#43594d] font-medium mb-1">DO bể hiếu khí (mg/L):</label>
                    <NumericInput
                      value={formData.doMgL ?? 0}
                      onChange={(val) => setFormData({ ...formData, doMgL: val })}
                      className="w-full px-2 py-1.5 rounded-lg border border-[#cfdcd4] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#43594d] font-medium mb-1">MLSS (mg/L):</label>
                    <NumericInput
                      value={formData.mlssMgL ?? 0}
                      onChange={(val) => setFormData({ ...formData, mlssMgL: val })}
                      className="w-full px-2 py-1.5 rounded-lg border border-[#cfdcd4] font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[#43594d] font-medium mb-1">SV30 (mL/L):</label>
                    <NumericInput
                      value={formData.sv30MlL ?? 0}
                      onChange={(val) => setFormData({ ...formData, sv30MlL: val })}
                      className="w-full px-2 py-1.5 rounded-lg border border-[#cfdcd4] font-mono"
                    />
                  </div>
                </div>

                {/* SVI live indicator */}
                <div className="p-2.5 bg-white rounded-lg border border-[#c5e2d1] flex items-center justify-between">
                  <div>
                    <span className="text-[11px] text-[#4d6657]">Chỉ số lắng SVI tự động tính:</span>
                    <div className="font-mono font-bold text-sm text-[#183b2b]">{liveSvi.svi} mL/g</div>
                  </div>
                  <div className="text-right max-w-xs text-[11px] text-[#55695e]">
                    {liveSvi.text}
                  </div>
                </div>
              </div>

              {/* Chất lượng nước đầu vào / đầu ra */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[#43594d] font-medium mb-1">pH Đầu vào:</label>
                  <NumericInput
                    value={formData.inletPh ?? 7}
                    onChange={(val) => setFormData({ ...formData, inletPh: val })}
                    className="w-full px-2 py-1.5 rounded-lg border border-[#cfdcd4] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#43594d] font-medium mb-1">pH Bể Aerotank:</label>
                  <NumericInput
                    value={formData.aerotankPh ?? 7}
                    onChange={(val) => setFormData({ ...formData, aerotankPh: val })}
                    className="w-full px-2 py-1.5 rounded-lg border border-[#cfdcd4] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#43594d] font-medium mb-1">COD Đầu vào (mg/L):</label>
                  <NumericInput
                    value={formData.codInMgL ?? 0}
                    onChange={(val) => setFormData({ ...formData, codInMgL: val })}
                    className="w-full px-2 py-1.5 rounded-lg border border-[#cfdcd4] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#43594d] font-medium mb-1">COD Đầu ra (mg/L):</label>
                  <NumericInput
                    value={formData.codOutMgL ?? 0}
                    onChange={(val) => setFormData({ ...formData, codOutMgL: val })}
                    className="w-full px-2 py-1.5 rounded-lg border border-[#cfdcd4] font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div>
                  <label className="block text-[#43594d] font-medium mb-1">NH₄⁺ Vào (mg/L):</label>
                  <NumericInput
                    value={formData.nh4InMgL ?? 0}
                    onChange={(val) => setFormData({ ...formData, nh4InMgL: val })}
                    className="w-full px-2 py-1.5 rounded-lg border border-[#cfdcd4] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#43594d] font-medium mb-1">NH₄⁺ Ra (mg/L):</label>
                  <NumericInput
                    value={formData.nh4OutMgL ?? 0}
                    onChange={(val) => setFormData({ ...formData, nh4OutMgL: val })}
                    className="w-full px-2 py-1.5 rounded-lg border border-[#cfdcd4] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#43594d] font-medium mb-1">Bùn xả Qw (m³/d):</label>
                  <NumericInput
                    value={formData.sludgeWastedM3Day ?? 0}
                    onChange={(val) => setFormData({ ...formData, sludgeWastedM3Day: val })}
                    className="w-full px-2 py-1.5 rounded-lg border border-[#cfdcd4] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Điện tiêu thụ (kWh):</label>
                  <NumericInput
                    value={formData.powerKwh ?? 0}
                    onChange={(val) => setFormData({ ...formData, powerKwh: val })}
                    className="w-full px-2 py-1.5 rounded-lg border border-[#cfdcd4] font-mono"
                  />
                </div>
              </div>

              {/* Ghi chú hóa chất & bảo trì */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Lượng hóa chất đã châm:</label>
                  <textarea
                    rows={2}
                    placeholder="VD: 5 kg NaHCO3, 2 kg Urê, 10L Javel..."
                    value={formData.chemicalNotes}
                    onChange={(e) => setFormData({ ...formData, chemicalNotes: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#cfdcd4]"
                  />
                </div>
                <div>
                  <label className="block text-[#43594d] font-semibold mb-1">Nhật ký thiết bị & Sự cố:</label>
                  <textarea
                    rows={2}
                    placeholder="VD: Bơm P-02 bảo trì tra mỡ, rửa song chắn rác..."
                    value={formData.maintenanceNotes}
                    onChange={(e) => setFormData({ ...formData, maintenanceNotes: e.target.value })}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-[#cfdcd4]"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex justify-end gap-2 pt-3 border-t border-[#edf4f0]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-[#176b45] hover:bg-[#125837] text-white font-semibold"
                >
                  Lưu nhật ký
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
