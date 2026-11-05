import React, { useState } from 'react';
import { ArrowRightLeft, Droplets, Gauge, Activity, Wind, Zap, Beaker, HelpCircle } from 'lucide-react';
import { NumericInput } from '../common/NumericInput';
import { formatNumber } from '../../utils/calculations';

type CategoryType = 'flow' | 'pressure' | 'concentration' | 'velocity' | 'volume' | 'power' | 'alkalinity';

interface UnitDef {
  key: string;
  name: string;
  symbol: string;
  toBase: (v: number) => number;
  fromBase: (b: number) => number;
}

const CATEGORIES: { id: CategoryType; label: string; icon: React.FC<{ className?: string }> }[] = [
  { id: 'flow', label: 'Lưu lượng', icon: Droplets },
  { id: 'pressure', label: 'Áp suất & Cột áp', icon: Gauge },
  { id: 'concentration', label: 'Nồng độ & Tải lượng', icon: Beaker },
  { id: 'velocity', label: 'Vận tốc', icon: Wind },
  { id: 'volume', label: 'Thể tích', icon: Activity },
  { id: 'power', label: 'Công suất', icon: Zap },
  { id: 'alkalinity', label: 'Độ kiềm & Độ cứng', icon: Activity },
];

// Unit definitions with base units:
// Flow base: m3/day
const FLOW_UNITS: UnitDef[] = [
  { key: 'm3d', name: 'Mét khối trên ngày', symbol: 'm³/ngày', toBase: v => v, fromBase: b => b },
  { key: 'm3h', name: 'Mét khối trên giờ', symbol: 'm³/h', toBase: v => v * 24, fromBase: b => b / 24 },
  { key: 'm3min', name: 'Mét khối trên phút', symbol: 'm³/phút', toBase: v => v * 1440, fromBase: b => b / 1440 },
  { key: 'ls', name: 'Lít trên giây', symbol: 'L/s', toBase: v => v * 86.4, fromBase: b => b / 86.4 },
  { key: 'lmin', name: 'Lít trên phút', symbol: 'L/phút', toBase: v => (v * 1440) / 1000, fromBase: b => (b * 1000) / 1440 },
  { key: 'lh', name: 'Lít trên giờ', symbol: 'L/h', toBase: v => (v * 24) / 1000, fromBase: b => (b * 1000) / 24 },
  { key: 'gpm', name: 'Gallon Mỹ trên phút (GPM)', symbol: 'GPM (US)', toBase: v => v * 5.45099, fromBase: b => b / 5.45099 },
  { key: 'mgd', name: 'Triệu Gallon trên ngày (MGD)', symbol: 'MGD (US)', toBase: v => v * 3785.41, fromBase: b => b / 3785.41 },
];

// Pressure base: mH2O (mét cột nước)
const PRESSURE_UNITS: UnitDef[] = [
  { key: 'mh2o', name: 'Mét cột nước', symbol: 'mH₂O', toBase: v => v, fromBase: b => b },
  { key: 'bar', name: 'Bar', symbol: 'bar', toBase: v => v * 10.1972, fromBase: b => b / 10.1972 },
  { key: 'kpa', name: 'Kilopascal', symbol: 'kPa', toBase: v => v * 0.101972, fromBase: b => b / 0.101972 },
  { key: 'pa', name: 'Pascal', symbol: 'Pa', toBase: v => v * 0.000101972, fromBase: b => b / 0.000101972 },
  { key: 'atm', name: 'Atmosphere tiêu chuẩn', symbol: 'atm', toBase: v => v * 10.3323, fromBase: b => b / 10.3323 },
  { key: 'at', name: 'Atmosphere kỹ thuật (kG/cm²)', symbol: 'at (kG/cm²)', toBase: v => v * 10.0, fromBase: b => b / 10.0 },
  { key: 'psi', name: 'Pound trên inch vuông', symbol: 'psi', toBase: v => v * 0.70307, fromBase: b => b / 0.70307 },
  { key: 'mmhg', name: 'Milimét thủy ngân', symbol: 'mmHg (Torr)', toBase: v => v * 0.0135951, fromBase: b => b / 0.0135951 },
  { key: 'mmh2o', name: 'Milimét cột nước', symbol: 'mmH₂O', toBase: v => v * 0.001, fromBase: b => b * 1000 },
];

// Concentration base: mg/L (g/m3, ppm in water)
const CONCENTRATION_UNITS: UnitDef[] = [
  { key: 'mgl', name: 'Miligam trên lít', symbol: 'mg/L (ppm)', toBase: v => v, fromBase: b => b },
  { key: 'gm3', name: 'Gam trên mét khối', symbol: 'g/m³', toBase: v => v, fromBase: b => b },
  { key: 'gl', name: 'Gam trên lít', symbol: 'g/L', toBase: v => v * 1000, fromBase: b => b / 1000 },
  { key: 'kgm3', name: 'Kilogam trên mét khối', symbol: 'kg/m³', toBase: v => v * 1000, fromBase: b => b / 1000 },
  { key: 'percent', name: 'Phần trăm nồng độ khối lượng (% kl/tt)', symbol: '% (w/v)', toBase: v => v * 10000, fromBase: b => b / 10000 },
  { key: 'ugl', name: 'Microgam trên lít (ppb)', symbol: 'µg/L (ppb)', toBase: v => v * 0.001, fromBase: b => b * 1000 },
  { key: 'molm3', name: 'Milimol trên lít (mmol/L)', symbol: 'mmol/L', toBase: v => v * 1, fromBase: b => b },
];

// Velocity base: m/s
const VELOCITY_UNITS: UnitDef[] = [
  { key: 'ms', name: 'Mét trên giây', symbol: 'm/s', toBase: v => v, fromBase: b => b },
  { key: 'mh', name: 'Mét trên giờ (tải trọng thủy lực bể lắng)', symbol: 'm/h (m³/m²·h)', toBase: v => v / 3600, fromBase: b => b * 3600 },
  { key: 'mday', name: 'Mét trên ngày (m³/m²·ngày)', symbol: 'm/ngày', toBase: v => v / 86400, fromBase: b => b * 86400 },
  { key: 'kmh', name: 'Kilômét trên giờ', symbol: 'km/h', toBase: v => v / 3.6, fromBase: b => b * 3.6 },
  { key: 'cms', name: 'Centimét trên giây', symbol: 'cm/s', toBase: v => v * 0.01, fromBase: b => b * 100 },
  { key: 'fts', name: 'Foot trên giây', symbol: 'ft/s', toBase: v => v * 0.3048, fromBase: b => b / 0.3048 },
];

// Volume base: m3
const VOLUME_UNITS: UnitDef[] = [
  { key: 'm3', name: 'Mét khối', symbol: 'm³', toBase: v => v, fromBase: b => b },
  { key: 'liter', name: 'Lít', symbol: 'Lít (L)', toBase: v => v / 1000, fromBase: b => b * 1000 },
  { key: 'gal_us', name: 'Gallon Mỹ', symbol: 'gal (US)', toBase: v => v * 0.00378541, fromBase: b => b / 0.00378541 },
  { key: 'ft3', name: 'Foot khối (Cubic Feet)', symbol: 'ft³ (cu ft)', toBase: v => v * 0.0283168, fromBase: b => b / 0.0283168 },
];

// Power base: kW
const POWER_UNITS: UnitDef[] = [
  { key: 'kw', name: 'Kilowatt', symbol: 'kW', toBase: v => v, fromBase: b => b },
  { key: 'hp', name: 'Mã lực cơ học (Horsepower)', symbol: 'HP (ngựa)', toBase: v => v * 0.7457, fromBase: b => b / 0.7457 },
  { key: 'hp_metric', name: 'Mã lực hệ mét (CV/PS)', symbol: 'CV / PS', toBase: v => v * 0.7355, fromBase: b => b / 0.7355 },
  { key: 'w', name: 'Watt', symbol: 'W', toBase: v => v * 0.001, fromBase: b => b * 1000 },
  { key: 'kva', name: 'kVA (với cosφ = 0.85)', symbol: 'kVA (cosφ 0.85)', toBase: v => v * 0.85, fromBase: b => b / 0.85 },
];

// Alkalinity & Hardness base: mg/L as CaCO3
const ALKALINITY_UNITS: UnitDef[] = [
  { key: 'mgcaco3', name: 'Miligam CaCO₃ trên lít', symbol: 'mg/L CaCO₃', toBase: v => v, fromBase: b => b },
  { key: 'meql', name: 'Milidương lượng trên lít (mEq/L)', symbol: 'mEq/L', toBase: v => v * 50.04, fromBase: b => b / 50.04 },
  { key: 'mmoll', name: 'Milimol trên lít (mmol/L)', symbol: 'mmol/L', toBase: v => v * 100.08, fromBase: b => b / 100.08 },
  { key: 'dh', name: 'Độ Đức (Grad Deutscher Härte - °dH)', symbol: '°dH', toBase: v => v * 17.848, fromBase: b => b / 17.848 },
  { key: 'df', name: 'Độ Pháp (°f)', symbol: '°f (TH)', toBase: v => v * 10.0, fromBase: b => b / 10.0 },
  { key: 'ge', name: 'Độ Anh (°e)', symbol: '°e', toBase: v => v * 14.254, fromBase: b => b / 14.254 },
];

export const UnitConverter: React.FC<{ initialFlow?: number }> = ({ initialFlow = 100 }) => {
  const [category, setCategory] = useState<CategoryType>('flow');
  const [inputValue, setInputValue] = useState<number>(initialFlow);
  const [selectedUnitKey, setSelectedUnitKey] = useState<string>('m3d');

  // Quick Loading Calculator state (Tải trọng kg/ngày từ Q và C)
  const [calcQ, setCalcQ] = useState<number>(initialFlow);
  const [calcC, setCalcC] = useState<number>(250); // mg/L BOD hoặc COD, TSS...

  // Get current units array
  let currentUnits: UnitDef[] = FLOW_UNITS;
  if (category === 'pressure') currentUnits = PRESSURE_UNITS;
  else if (category === 'concentration') currentUnits = CONCENTRATION_UNITS;
  else if (category === 'velocity') currentUnits = VELOCITY_UNITS;
  else if (category === 'volume') currentUnits = VOLUME_UNITS;
  else if (category === 'power') currentUnits = POWER_UNITS;
  else if (category === 'alkalinity') currentUnits = ALKALINITY_UNITS;

  // Selected unit definition
  const currentUnitDef = currentUnits.find(u => u.key === selectedUnitKey) || currentUnits[0];

  // Base value calculated from selected input
  const baseValue = currentUnitDef.toBase(inputValue);

  // Switch category helper
  const handleCategoryChange = (newCat: CategoryType) => {
    setCategory(newCat);
    if (newCat === 'flow') {
      setSelectedUnitKey('m3d');
      setInputValue(100);
    } else if (newCat === 'pressure') {
      setSelectedUnitKey('mh2o');
      setInputValue(10);
    } else if (newCat === 'concentration') {
      setSelectedUnitKey('mgl');
      setInputValue(250);
    } else if (newCat === 'velocity') {
      setSelectedUnitKey('ms');
      setInputValue(1.0);
    } else if (newCat === 'volume') {
      setSelectedUnitKey('m3');
      setInputValue(50);
    } else if (newCat === 'power') {
      setSelectedUnitKey('kw');
      setInputValue(5.5);
    } else if (newCat === 'alkalinity') {
      setSelectedUnitKey('mgcaco3');
      setInputValue(150);
    }
  };

  // Quick Mass Loading: kg/day = Q (m3/d) * C (mg/L) / 1000
  const massLoadKgDay = (calcQ * calcC) / 1000;
  const massLoadKgHour = massLoadKgDay / 24;

  return (
    <div className="space-y-6">
      {/* Category selector pills */}
      <div className="bg-white p-3 rounded-2xl border border-[#d6e3db] shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          {CATEGORIES.map(cat => {
            const Icon = cat.icon;
            const isActive = category === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => handleCategoryChange(cat.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                  isActive
                    ? 'bg-[#176b45] text-white shadow-sm'
                    : 'bg-[#f4f7f5] text-[#2c4e3b] hover:bg-[#e6efe9]'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-[#176b45]'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input selection (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-[#d6e3db] shadow-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-[#e5eee8] pb-3">
              <ArrowRightLeft className="w-4 h-4 text-[#176b45]" />
              <h3 className="text-sm font-bold text-[#183a2a]">Nhập giá trị quy đổi</h3>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-[#234333] mb-1.5">Số lượng cần đổi</label>
                <NumericInput
                  min={0}
                  step={0.1}
                  defaultValue={inputValue}
                  value={inputValue}
                  onChange={(val) => setInputValue(val)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-[#cbd8d0] font-extrabold text-lg text-[#176b45] focus:border-[#176b45] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#234333] mb-1.5">Từ đơn vị nguồn</label>
                <select
                  value={currentUnitDef.key}
                  onChange={(e) => setSelectedUnitKey(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] font-semibold text-xs text-[#1a3a2a] bg-white"
                >
                  {currentUnits.map(unit => (
                    <option key={unit.key} value={unit.key}>
                      {unit.symbol} — {unit.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quick explanation tag */}
            <div className="p-3 bg-[#f6f9f7] rounded-xl border border-[#dbe6df] text-[11px] text-[#415e4f] space-y-1">
              <span className="font-bold text-[#1c4531] block">Gợi ý ứng dụng:</span>
              {category === 'flow' && (
                <p>• Dùng để chuyển đổi lưu lượng bơm (m³/h, L/s) sang công suất ngày (m³/ngày) của trạm và lưu lượng bơm định lượng hóa chất (L/h).</p>
              )}
              {category === 'pressure' && (
                <p>• Cột áp bơm nước thường tính bằng <strong>mH₂O</strong>, trong khi áp lực máy thổi khí thường tính bằng <strong>kPa</strong> hoặc <strong>bar</strong> (1 bar ≈ 10.2 mH₂O ≈ 100 kPa).</p>
              )}
              {category === 'concentration' && (
                <p>• 1 mg/L = 1 g/m³ = 1 ppm đối với dung dịch nước loãng. Nồng độ % hóa chất = (mg/L) / 10,000 (ví dụ Javel 10% = 100,000 mg/L).</p>
              )}
              {category === 'velocity' && (
                <p>• Vận tốc tự chảy cống thoát nước: 0.7 - 1.5 m/s. Vận tốc ống hút bơm: 0.8 - 1.2 m/s. Vận tốc ống đẩy bơm: 1.5 - 2.0 m/s.</p>
              )}
              {category === 'power' && (
                <p>• 1 kW ≈ 1.341 HP (mã lực). Động cơ máy bơm và máy thổi khí ở Việt Nam thường ghi cả công suất kW và HP.</p>
              )}
              {category === 'alkalinity' && (
                <p>• 1 mEq/L độ kiềm = 50.04 mg/L CaCO₃. Cần tối thiểu 50 - 100 mg/L CaCO₃ trong nước thải để quá trình Nitrat hóa diễn ra ổn định.</p>
              )}
            </div>
          </div>

          {/* Bonus Tool: Quick Mass Loading (Tải lượng kg/ngày) */}
          <div className="bg-gradient-to-br from-[#f8faf8] to-[#edf4f0] p-5 rounded-2xl border border-[#d4e4db] shadow-sm space-y-3">
            <div className="flex items-center gap-2 border-b border-[#d2e2d9] pb-2">
              <Beaker className="w-4 h-4 text-[#176b45]" />
              <h4 className="text-xs font-bold text-[#1b4330] uppercase tracking-wider">
                Tính nhanh tải lượng ô nhiễm
              </h4>
            </div>

            <p className="text-[11px] text-[#4d6657]">
              Công thức: <code className="bg-white px-1.5 py-0.5 rounded border border-[#d0ded5] text-[#176b45] font-bold">Tải lượng (kg/ngày) = Q × C / 1000</code>
            </p>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <label className="block text-[10px] font-semibold text-[#3b5446] mb-1">Lưu lượng Q (m³/ngày)</label>
                <NumericInput
                  min={0}
                  defaultValue={calcQ}
                  value={calcQ}
                  onChange={(val) => setCalcQ(val)}
                  className="w-full px-2 py-1.5 rounded-lg border border-[#cbd8d0] font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-[#3b5446] mb-1">Nồng độ C (mg/L)</label>
                <NumericInput
                  min={0}
                  defaultValue={calcC}
                  value={calcC}
                  onChange={(val) => setCalcC(val)}
                  className="w-full px-2 py-1.5 rounded-lg border border-[#cbd8d0] font-bold text-xs"
                />
              </div>
            </div>

            <div className="p-3 bg-white rounded-xl border border-[#cedfd5] flex justify-between items-center">
              <div>
                <span className="text-[11px] text-gray-500 block">Tải lượng chất ô nhiễm:</span>
                <span className="text-xs font-bold text-[#1f4532]">({formatNumber(massLoadKgHour, 2)} kg/giờ)</span>
              </div>
              <div className="text-right">
                <span className="text-base font-extrabold text-[#176b45] tabular-nums">
                  {formatNumber(massLoadKgDay, 2)}
                </span>{' '}
                <span className="text-xs font-bold text-[#176b45]">kg/ngày</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Complete Conversion Table (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-[#d6e3db] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#e5eee8] pb-3">
              <div>
                <h3 className="text-sm font-bold text-[#183a2a]">
                  Bảng kết quả quy đổi tương đương
                </h3>
                <p className="text-[11px] text-[#63776d]">
                  Tất cả đơn vị tương ứng của giá trị <strong className="text-[#176b45]">{formatNumber(inputValue)} {currentUnitDef.symbol}</strong>
                </p>
              </div>
              <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#eef6f1] text-[#176b45] border border-[#d3e5dc]">
                {currentUnits.length} đơn vị
              </span>
            </div>

            <div className="space-y-2">
              {currentUnits.map(unit => {
                const convertedValue = unit.fromBase(baseValue);
                const isSelected = unit.key === currentUnitDef.key;

                return (
                  <div
                    key={unit.key}
                    className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'bg-[#f0f8f3] border-[#176b45] shadow-xs'
                        : 'bg-white border-[#e5eee8] hover:border-[#ccdcd2]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <strong className={`text-xs ${isSelected ? 'text-[#176b45] font-extrabold' : 'text-[#1d3d2e] font-bold'}`}>
                          {unit.symbol}
                        </strong>
                        {isSelected && (
                          <span className="text-[10px] font-bold bg-[#176b45] text-white px-1.5 py-0.2 rounded">
                            Gốc
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-gray-500">{unit.name}</div>
                    </div>

                    <div className="text-right">
                      <span className={`text-sm font-extrabold tabular-nums ${isSelected ? 'text-[#176b45]' : 'text-[#204030]'}`}>
                        {Math.abs(convertedValue) < 0.0001 && convertedValue !== 0
                          ? convertedValue.toExponential(4)
                          : formatNumber(convertedValue, convertedValue >= 100 ? 2 : convertedValue >= 1 ? 3 : 5)}
                      </span>{' '}
                      <span className="text-xs text-gray-500 font-semibold">{unit.symbol}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
