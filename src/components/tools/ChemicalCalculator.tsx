import React, { useState } from 'react';
import { Copy, Check, FlaskConical, AlertCircle, Info } from 'lucide-react';
import { formatNumber } from '../../utils/calculations';
import { NumericInput } from '../common/NumericInput';

interface ChemicalCalculatorProps {
  initialQ?: number; // m3/day
}

interface ChemicalPreset {
  id: string;
  name: string;
  category: string;
  defaultDoseMgL: number;
  commercialPurityPercent: number;
  solutionConcPercent: number;
  densityKgL: number;
  unitPriceVndKg: number;
  note: string;
}

const CHEMICAL_PRESETS: ChemicalPreset[] = [
  {
    id: 'pac',
    name: 'Keo tụ PAC (Poly Aluminium Chloride)',
    category: 'Keo tụ tạo bông',
    defaultDoseMgL: 40,
    commercialPurityPercent: 30, // 30% Al2O3
    solutionConcPercent: 10, // Pha 10% trong bồn
    densityKgL: 1.25,
    unitPriceVndKg: 12000,
    note: 'Hiệu quả keo tụ cao, dải pH rộng 6.0 – 8.5, ít làm giảm pH nước',
  },
  {
    id: 'alum',
    name: 'Phèn nhôm Al₂(SO₄)₃·14-18H₂O',
    category: 'Keo tụ tạo bông',
    defaultDoseMgL: 50,
    commercialPurityPercent: 17,
    solutionConcPercent: 10,
    densityKgL: 1.15,
    unitPriceVndKg: 7500,
    note: 'Làm giảm pH nước, cần kiểm tra và bù kiềm nếu độ kiềm < 50 mg/L',
  },
  {
    id: 'fecl3',
    name: 'Phèn sắt Ferric Chloride FeCl₃',
    category: 'Keo tụ & Khử P',
    defaultDoseMgL: 35,
    commercialPurityPercent: 40,
    solutionConcPercent: 10,
    densityKgL: 1.42,
    unitPriceVndKg: 9000,
    note: 'Chuyên dùng lắng hóa lý & kết tủa photphat photpho P triệt để',
  },
  {
    id: 'pam_a',
    name: 'Polymer Anion (PAM-A)',
    category: 'Trợ lắng',
    defaultDoseMgL: 2.0,
    commercialPurityPercent: 100, // Bột nguyên chất
    solutionConcPercent: 0.1, // Pha loãng 0.1% (1 kg / 1000L)
    densityKgL: 1.0,
    unitPriceVndKg: 65000,
    note: 'Kích thích kết bông to, pha dung dịch loãng 0.05 – 0.1% tránh vón cục',
  },
  {
    id: 'pam_c',
    name: 'Polymer Cation (PAM-C)',
    category: 'Ép bùn vi sinh',
    defaultDoseMgL: 5.0,
    commercialPurityPercent: 100,
    solutionConcPercent: 0.2, // 0.2%
    densityKgL: 1.0,
    unitPriceVndKg: 85000,
    note: 'Đông tụ bùn hữu cơ hoạt tính cho máy ép bùn khung bản / ly tâm / trục vít',
  },
  {
    id: 'javel',
    name: 'Javel lỏng NaOCl 10%',
    category: 'Khử trùng',
    defaultDoseMgL: 8.0,
    commercialPurityPercent: 10, // 10% Clo hoạt tính
    solutionConcPercent: 10, // Dùng trực tiếp hoặc pha 5%
    densityKgL: 1.18,
    unitPriceVndKg: 4500,
    note: 'Khử trùng Coliform nước thải sau lắng, liều thường 5 – 10 mg/L',
  },
  {
    id: 'chlorine_powder',
    name: 'Chlorine bột Ca(OCl)₂ (Nhật/Ấn Độ)',
    category: 'Khử trùng',
    defaultDoseMgL: 6.0,
    commercialPurityPercent: 70, // 70% Clo hoạt tính
    solutionConcPercent: 5.0,
    densityKgL: 1.05,
    unitPriceVndKg: 48000,
    note: 'Hòa tan và để lắng cặn vôi trước khi hút vào bơm định lượng',
  },
  {
    id: 'naoh',
    name: 'Xút lỏng NaOH 32%',
    category: 'Điều chỉnh pH',
    defaultDoseMgL: 30,
    commercialPurityPercent: 32,
    solutionConcPercent: 20,
    densityKgL: 1.35,
    unitPriceVndKg: 8500,
    note: 'Nâng pH và bù độ kiềm cho quá trình Nitrat hóa vi sinh',
  },
  {
    id: 'h2so4',
    name: 'Axit Sunfuric H₂SO₄ 98%',
    category: 'Điều chỉnh pH',
    defaultDoseMgL: 25,
    commercialPurityPercent: 98,
    solutionConcPercent: 10,
    densityKgL: 1.84,
    unitPriceVndKg: 4000,
    note: 'Hạ pH nước thải kiềm tính (dệt nhuộm, giặt là, tẩy rửa)',
  },
  {
    id: 'molasses',
    name: 'Mật rỉ đường (Rỉ mật C)',
    category: 'Nguồn Carbon vi sinh',
    defaultDoseMgL: 50,
    commercialPurityPercent: 80, // COD tương đương ~ 0.85 kg COD/kg
    solutionConcPercent: 20,
    densityKgL: 1.4,
    unitPriceVndKg: 9500,
    note: 'Bổ sung Carbon cho bể thiếu khí Anoxic khử Nitrat và cân bằng C:N:P',
  },
];

export const ChemicalCalculator: React.FC<ChemicalCalculatorProps> = ({ initialQ = 100 }) => {
  const [flowM3Day, setFlowM3Day] = useState<number>(initialQ > 0 ? initialQ : 100);
  const [selectedChemicalId, setSelectedChemicalId] = useState<string>('pac');

  const selectedChem = CHEMICAL_PRESETS.find((c) => c.id === selectedChemicalId) || CHEMICAL_PRESETS[0];

  const [doseMgL, setDoseMgL] = useState<number>(selectedChem.defaultDoseMgL);
  const [commercialPurity, setCommercialPurity] = useState<number>(selectedChem.commercialPurityPercent);
  const [tankSolutionConc, setTankSolutionConc] = useState<number>(selectedChem.solutionConcPercent);
  const [densityKgL, setDensityKgL] = useState<number>(selectedChem.densityKgL);
  const [tankVolumeM3, setTankVolumeM3] = useState<number>(1.0); // 1 m3 = 1000 L
  const [operatingHours, setOperatingHours] = useState<number>(24);
  const [unitPriceVnd, setUnitPriceVnd] = useState<number>(selectedChem.unitPriceVndKg);

  const [copied, setCopied] = useState(false);

  const handleSelectChemical = (id: string) => {
    setSelectedChemicalId(id);
    const chem = CHEMICAL_PRESETS.find((c) => c.id === id);
    if (chem) {
      setDoseMgL(chem.defaultDoseMgL);
      setCommercialPurity(chem.commercialPurityPercent);
      setTankSolutionConc(chem.solutionConcPercent);
      setDensityKgL(chem.densityKgL);
      setUnitPriceVnd(chem.unitPriceVndKg);
    }
  };

  // --- CALCULATION ---
  // 1. Pure chemical mass per day (kg/day): (Q * Dose) / 1000
  const pureMassKgDay = (Math.max(0, flowM3Day) * Math.max(0, doseMgL)) / 1000;

  // 2. Commercial chemical consumption per day (kg/day): pureMass / (purity / 100)
  const purityDec = Math.max(1, commercialPurity) / 100;
  const commercialMassKgDay = pureMassKgDay / purityDec;

  // Commercial chemical volume (L/day)
  const commercialVolLDay = densityKgL > 0 ? commercialMassKgDay / densityKgL : commercialMassKgDay;

  // 3. Solution in tank (Concentration %):
  // Volume of prepared solution dosed per day (L/day):
  // 1 kg pure chem in solution = 100 / concPercent Liters
  const solutionConcDec = Math.max(0.01, tankSolutionConc) / 100;
  const dosedSolutionVolumeLDay = pureMassKgDay / solutionConcDec; // Liters of solution per day

  // 4. Dosing pump capacity (L/h and mL/min)
  const dosingPumpLHour = operatingHours > 0 ? dosedSolutionVolumeLDay / operatingHours : 0;
  const dosingPumpMlMin = (dosingPumpLHour * 1000) / 60;

  // 5. Batch preparation for 1 full tank:
  // For a tank of V m3 (= V*1000 L) of conc %:
  // Pure chemical needed per tank = (tankVolumeM3 * 1000) * (tankSolutionConc / 100) kg
  const purePerTankKg = tankVolumeM3 * 1000 * solutionConcDec;
  const commercialPerTankKg = purePerTankKg / purityDec;
  const commercialPerTankL = densityKgL > 0 ? commercialPerTankKg / densityKgL : commercialPerTankKg;

  // How long does 1 full tank last? (hours & days)
  const tankDurationHours = dosingPumpLHour > 0 ? (tankVolumeM3 * 1000) / dosingPumpLHour : 0;
  const tankDurationDays = tankDurationHours / 24;

  // 6. Cost Estimation
  const dailyCostVnd = commercialMassKgDay * unitPriceVnd;
  const unitCostVndPerM3 = flowM3Day > 0 ? dailyCostVnd / flowM3Day : 0;

  const handleCopySummary = () => {
    const text = `KẾT QUẢ TÍNH PHA CHẾ & CHÂM HÓA CHẤT:
- Hóa chất: ${selectedChem.name}
- Lưu lượng nước xử lý: ${formatNumber(flowM3Day)} m³/ngày (${formatNumber(flowM3Day / operatingHours, 2)} m³/h)
- Liều lượng châm: ${formatNumber(doseMgL, 2)} mg/L (g/m³)
- Khối lượng hóa chất thương phẩm (${commercialPurity}%): ${formatNumber(commercialMassKgDay, 2)} kg/ngày (~${formatNumber(commercialVolLDay, 1)} Lít/ngày)
- Lưu lượng bơm định lượng yêu cầu: ${formatNumber(dosingPumpLHour, 2)} L/h (~${formatNumber(dosingPumpMlMin, 1)} mL/phút)
- Công thức pha 1 bồn ${formatNumber(tankVolumeM3, 1)} m³ (${tankSolutionConc}%): Cần ${formatNumber(commercialPerTankKg, 2)} kg (${formatNumber(commercialPerTankL, 1)} Lít) hóa chất gốc
- Thời gian dùng hết 1 bồn: ${formatNumber(tankDurationHours, 1)} giờ (~${formatNumber(tankDurationDays, 1)} ngày)
- Chi phí hóa chất ước tính: ${formatNumber(dailyCostVnd, 0)} VNĐ/ngày (${formatNumber(unitCostVndPerM3, 0)} VNĐ/m³ nước thải)`;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="bg-white p-5 rounded-2xl border border-[#cbd8d0] shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-[#18392b] flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-[#e7f3ec] text-[#176b45] flex items-center justify-center text-sm font-bold">
              🧪
            </span>
            <span>Tiện ích Tính toán Pha chế & Châm Hóa chất</span>
          </h2>
          <p className="text-xs text-[#62776c] mt-0.5">
            Tính khối lượng hóa chất thương phẩm, lưu lượng bơm định lượng L/h, công thức pha bồn và chi phí vận hành
          </p>
        </div>

        <button
          type="button"
          onClick={handleCopySummary}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#f0f6f2] hover:bg-[#e2ede6] text-[#176b45] text-xs font-bold border border-[#c4d7cc] transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Đã sao chép kết quả' : 'Sao chép kết quả'}</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* INPUTS COLUMN */}
        <div className="lg:col-span-6 space-y-5">
          {/* Preset Selector */}
          <div className="bg-white p-5 rounded-2xl border border-[#cbd8d0] shadow-sm space-y-4">
            <label className="block text-xs font-bold text-[#234333] uppercase tracking-wider">
              1. Lựa chọn hóa chất sử dụng
            </label>

            <div className="space-y-2">
              <select
                value={selectedChemicalId}
                onChange={(e) => handleSelectChemical(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-[#cbd8d0] text-xs font-bold text-[#183929] bg-white focus:border-[#176b45]"
              >
                {CHEMICAL_PRESETS.map((c) => (
                  <option key={c.id} value={c.id}>
                    [{c.category}] {c.name}
                  </option>
                ))}
              </select>

              <div className="p-3 bg-[#f5faf7] border border-[#d2e6da] rounded-xl text-[11px] text-[#3c5446]">
                <strong className="text-[#176b45]">Đặc tính: </strong>
                {selectedChem.note}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  Lưu lượng nước xử lý Q (m³/ngày)
                </label>
                <NumericInput
                  step={10}
                  min={1}
                  value={flowM3Day}
                  fallbackValue={100}
                  onChange={(val) => setFlowM3Day(val ?? 100)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-sm text-[#183929] bg-white font-bold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  Liều lượng châm (mg/L = g/m³)
                </label>
                <NumericInput
                  step={1}
                  min={0.1}
                  value={doseMgL}
                  fallbackValue={selectedChem.defaultDoseMgL}
                  onChange={(val) => setDoseMgL(val ?? selectedChem.defaultDoseMgL)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-sm text-[#183929] bg-white font-bold"
                />
              </div>
            </div>
          </div>

          {/* Concentration & Tank */}
          <div className="bg-white p-5 rounded-2xl border border-[#cbd8d0] shadow-sm space-y-4">
            <label className="block text-xs font-bold text-[#234333] uppercase tracking-wider">
              2. Nồng độ thương phẩm & Bồn pha chế
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  Nồng độ hóa chất gốc (%)
                </label>
                <NumericInput
                  step={1}
                  min={0.1}
                  max={100}
                  value={commercialPurity}
                  fallbackValue={selectedChem.commercialPurityPercent}
                  onChange={(val) => setCommercialPurity(val ?? selectedChem.commercialPurityPercent)}
                  className="w-full px-3 py-2 rounded-xl border border-[#cbd8d0] text-xs font-semibold"
                />
                <span className="text-[10px] text-[#708477]">Độ tinh khiết bao bì thương phẩm</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  Nồng độ dung dịch trong bồn (%)
                </label>
                <NumericInput
                  step={0.5}
                  min={0.01}
                  max={50}
                  value={tankSolutionConc}
                  fallbackValue={selectedChem.solutionConcPercent}
                  onChange={(val) => setTankSolutionConc(val ?? selectedChem.solutionConcPercent)}
                  className="w-full px-3 py-2 rounded-xl border border-[#cbd8d0] text-xs font-semibold"
                />
                <span className="text-[10px] text-[#708477]">Nồng độ sau khi châm nước vào bồn</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  Dung tích bồn hóa chất (m³)
                </label>
                <NumericInput
                  step={0.2}
                  min={0.1}
                  value={tankVolumeM3}
                  fallbackValue={1.0}
                  onChange={(val) => setTankVolumeM3(val ?? 1.0)}
                  className="w-full px-3 py-2 rounded-xl border border-[#cbd8d0] text-xs font-semibold"
                />
                <span className="text-[10px] text-[#708477]">1 m³ = 1.000 Lít bồn nhựa PE</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  Thời gian bơm châm (giờ/ngày)
                </label>
                <NumericInput
                  step={1}
                  min={1}
                  max={24}
                  value={operatingHours}
                  fallbackValue={24}
                  onChange={(val) => setOperatingHours(val ?? 24)}
                  className="w-full px-3 py-2 rounded-xl border border-[#cbd8d0] text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Đơn giá hóa chất (VNĐ/kg)</label>
                <NumericInput
                  step={500}
                  min={0}
                  value={unitPriceVnd}
                  fallbackValue={selectedChem.unitPriceVndKg}
                  onChange={(val) => setUnitPriceVnd(val ?? selectedChem.unitPriceVndKg)}
                  className="w-full px-3 py-2 rounded-xl border border-[#cbd8d0] text-xs font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Khối lượng riêng ρ (kg/L)</label>
                <NumericInput
                  step={0.05}
                  min={0.5}
                  max={2.0}
                  value={densityKgL}
                  fallbackValue={selectedChem.densityKgL}
                  onChange={(val) => setDensityKgL(val ?? selectedChem.densityKgL)}
                  className="w-full px-3 py-2 rounded-xl border border-[#cbd8d0] text-xs font-semibold"
                />
              </div>
            </div>
          </div>
        </div>

        {/* RESULTS COLUMN */}
        <div className="lg:col-span-6 space-y-5">
          {/* Main Dosing Pump Card */}
          <div className="p-6 rounded-2xl bg-gradient-to-br from-[#16603e] to-[#0e432a] text-white shadow-md space-y-4">
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-200 block">
              Lưu lượng bơm định lượng yêu cầu
            </span>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-white">
                {formatNumber(dosingPumpLHour, 2)}
              </span>
              <span className="text-2xl font-bold text-emerald-200">L/h</span>
              <span className="text-sm font-semibold text-emerald-300 ml-2">
                (~{formatNumber(dosingPumpMlMin, 1)} mL/phút)
              </span>
            </div>

            <div className="pt-3 border-t border-white/20 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-emerald-200 block text-[11px]">Hóa chất gốc dùng mỗi ngày:</span>
                <span className="text-lg font-bold font-mono text-white">
                  {formatNumber(commercialMassKgDay, 2)} kg/ngày
                </span>
                <span className="text-[10px] text-emerald-300 block">
                  (~{formatNumber(commercialVolLDay, 1)} Lít/ngày)
                </span>
              </div>
              <div>
                <span className="text-emerald-200 block text-[11px]">Chi phí hóa chất ước tính:</span>
                <span className="text-lg font-bold font-mono text-white">
                  {formatNumber(dailyCostVnd, 0)} đ/ngày
                </span>
                <span className="text-[10px] text-emerald-300 block">
                  (~{formatNumber(unitCostVndPerM3, 0)} đ/m³ nước)
                </span>
              </div>
            </div>
          </div>

          {/* Batch mixing recipe card */}
          <div className="bg-white p-5 rounded-2xl border border-[#cbd8d0] shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-[#1e3e2f] uppercase tracking-wider flex items-center justify-between">
              <span>Hướng dẫn pha 1 bồn {tankVolumeM3} m³ ({formatNumber(tankVolumeM3 * 1000, 0)} Lít)</span>
              <span className="text-[#176b45] font-bold text-xs bg-[#e9f4ee] px-2.5 py-1 rounded-lg">
                Dùng được ~{formatNumber(tankDurationDays, 1)} ngày
              </span>
            </h3>

            <div className="p-4 bg-[#f8fbf9] border border-[#d6e7dc] rounded-xl space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1 border-b border-[#e5efe8]">
                <span className="text-[#496354]">Khối lượng hóa chất gốc cần cân:</span>
                <strong className="text-sm font-bold font-mono text-[#176b45]">
                  {formatNumber(commercialPerTankKg, 2)} kg
                </strong>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#e5efe8]">
                <span className="text-[#496354]">Thể tích hóa chất lỏng tương đương:</span>
                <strong className="text-sm font-bold font-mono text-[#176b45]">
                  {formatNumber(commercialPerTankL, 1)} Lít
                </strong>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-[#e5efe8]">
                <span className="text-[#496354]">Lượng nước sạch châm đầy bồn:</span>
                <strong className="font-mono text-[#183929]">
                  ~{formatNumber(tankVolumeM3 * 1000 - commercialPerTankL, 0)} Lít
                </strong>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="text-[#496354]">Thời gian sử dụng hết 1 bồn:</span>
                <strong className="font-mono text-[#183929]">
                  {formatNumber(tankDurationHours, 1)} giờ hoạt động
                </strong>
              </div>
            </div>
          </div>

          {/* Breakdown parameters */}
          <div className="bg-white p-5 rounded-2xl border border-[#cbd8d0] shadow-sm space-y-2 text-xs">
            <h4 className="font-bold text-[#1a3b2b] uppercase tracking-wider text-[11px]">
              Tóm tắt chỉ số tiêu thụ
            </h4>
            <div className="flex justify-between py-1 border-b border-[#edf3ef]">
              <span className="text-[#556c5e]">Nhu cầu hóa chất nguyên chất 100%</span>
              <span className="font-mono font-bold text-[#183929]">{formatNumber(pureMassKgDay, 3)} kg/ngày</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#edf3ef]">
              <span className="text-[#556c5e]">Tổng dung dịch loãng châm vào dòng nước</span>
              <span className="font-mono font-bold text-[#183929]">{formatNumber(dosedSolutionVolumeLDay, 1)} Lít/ngày</span>
            </div>
            <div className="flex justify-between py-1 border-b border-[#edf3ef]">
              <span className="text-[#556c5e]">Tỷ lệ châm dung dịch so với dòng nước</span>
              <span className="font-mono font-bold text-[#183929]">
                {formatNumber((dosedSolutionVolumeLDay / (flowM3Day * 1000)) * 100, 3)}%
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
