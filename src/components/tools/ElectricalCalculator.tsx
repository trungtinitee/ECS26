import React, { useState } from 'react';
import { Zap, HelpCircle, RotateCcw, Plus, Trash2, Cpu, ShieldAlert, Award } from 'lucide-react';
import { NumericInput } from '../common/NumericInput';
import { formatNumber } from '../../utils/calculations';

interface EquipmentItem {
  id: string;
  name: string;
  powerKw: number;
  qtyRun: number;
  qtyStandby: number;
  hoursPerDay: number;
  cosPhi: number;
}

const DEFAULT_EQUIPMENTS: EquipmentItem[] = [
  { id: '1', name: 'Bơm nước thải thô (Hố thu / Gom)', powerKw: 2.2, qtyRun: 1, qtyStandby: 1, hoursPerDay: 16, cosPhi: 0.85 },
  { id: '2', name: 'Máy thổi khí hiếu khí (Aerotank)', powerKw: 5.5, qtyRun: 1, qtyStandby: 1, hoursPerDay: 24, cosPhi: 0.85 },
  { id: '3', name: 'Máy khuấy chìm Anoxic', powerKw: 1.5, qtyRun: 1, qtyStandby: 0, hoursPerDay: 24, cosPhi: 0.82 },
  { id: '4', name: 'Bơm tuần hoàn bùn RAS / xả WAS', powerKw: 1.5, qtyRun: 1, qtyStandby: 1, hoursPerDay: 18, cosPhi: 0.82 },
  { id: '5', name: 'Bơm định lượng hóa chất (PAC, Javel)', powerKw: 0.37, qtyRun: 2, qtyStandby: 0, hoursPerDay: 12, cosPhi: 0.80 },
  { id: '6', name: 'Máy ép bùn trục vít / băng tải', powerKw: 2.2, qtyRun: 1, qtyStandby: 0, hoursPerDay: 6, cosPhi: 0.85 },
  { id: '7', name: 'Chiếu sáng, quạt & tủ điều khiển PLC', powerKw: 1.0, qtyRun: 1, qtyStandby: 0, hoursPerDay: 24, cosPhi: 0.90 },
];

export const ElectricalCalculator: React.FC<{ flow_m3d?: number }> = ({ flow_m3d = 100 }) => {
  const [items, setItems] = useState<EquipmentItem[]>(DEFAULT_EQUIPMENTS);
  const [flow, setFlow] = useState<number>(flow_m3d);
  const [simultaneityFactor, setSimultaneityFactor] = useState<number>(0.85); // K_đồng thời
  const [loadFactor, setLoadFactor] = useState<number>(0.80); // K_sử dụng / phụ tải
  const [voltage, setVoltage] = useState<number>(380); // 380V 3 pha hoặc 220V 1 pha
  const [electricityTariff, setElectricityTariff] = useState<number>(2050); // đ/kWh

  // Presets
  const applyPreset = (scale: 'small' | 'medium' | 'large') => {
    if (scale === 'small') {
      setFlow(50);
      setItems([
        { id: '1', name: 'Bơm hố gom (1 hoạt động, 1 dự phòng)', powerKw: 1.5, qtyRun: 1, qtyStandby: 1, hoursPerDay: 14, cosPhi: 0.82 },
        { id: '2', name: 'Máy thổi khí (1 chạy, 1 nghỉ)', powerKw: 3.7, qtyRun: 1, qtyStandby: 1, hoursPerDay: 24, cosPhi: 0.85 },
        { id: '3', name: 'Máy khuấy chìm thiếu khí', powerKw: 0.75, qtyRun: 1, qtyStandby: 0, hoursPerDay: 24, cosPhi: 0.80 },
        { id: '4', name: 'Bơm bùn tuần hoàn & xả', powerKw: 0.75, qtyRun: 1, qtyStandby: 1, hoursPerDay: 16, cosPhi: 0.80 },
        { id: '5', name: 'Bơm định lượng & chiếu sáng phụ trợ', powerKw: 0.8, qtyRun: 1, qtyStandby: 0, hoursPerDay: 12, cosPhi: 0.85 },
      ]);
    } else if (scale === 'medium') {
      setFlow(300);
      setItems(DEFAULT_EQUIPMENTS);
    } else {
      setFlow(1500);
      setItems([
        { id: '1', name: 'Bơm chìm nước thô trạm bơm chính', powerKw: 11, qtyRun: 2, qtyStandby: 1, hoursPerDay: 18, cosPhi: 0.86 },
        { id: '2', name: 'Máy thổi khí Roots Aerotank', powerKw: 30, qtyRun: 2, qtyStandby: 1, hoursPerDay: 24, cosPhi: 0.87 },
        { id: '3', name: 'Máy khuấy chìm bể điều hòa + Anoxic', powerKw: 3.7, qtyRun: 3, qtyStandby: 0, hoursPerDay: 24, cosPhi: 0.83 },
        { id: '4', name: 'Bơm bùn tuần hoàn RAS', powerKw: 5.5, qtyRun: 2, qtyStandby: 1, hoursPerDay: 20, cosPhi: 0.85 },
        { id: '5', name: 'Hệ châm hóa chất keo tụ PAC/PAM/Javel', powerKw: 1.5, qtyRun: 3, qtyStandby: 1, hoursPerDay: 16, cosPhi: 0.82 },
        { id: '6', name: 'Máy ép bùn ly tâm / trục vít đa đĩa', powerKw: 7.5, qtyRun: 1, qtyStandby: 0, hoursPerDay: 8, cosPhi: 0.86 },
        { id: '7', name: 'Phụ trợ, chiếu sáng trạm, quạt thông gió, tủ PLC', powerKw: 3.0, qtyRun: 1, qtyStandby: 0, hoursPerDay: 24, cosPhi: 0.90 },
      ]);
    }
  };

  const addItem = () => {
    const newItem: EquipmentItem = {
      id: Date.now().toString(),
      name: `Thiết bị mới ${items.length + 1}`,
      powerKw: 1.5,
      qtyRun: 1,
      qtyStandby: 1,
      hoursPerDay: 16,
      cosPhi: 0.85,
    };
    setItems([...items, newItem]);
  };

  const updateItem = (id: string, field: keyof EquipmentItem, value: any) => {
    setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
  };

  const removeItem = (id: string) => {
    setItems(items.filter(item => item.id !== id));
  };

  // Calculations
  // Total installed power (P_dat): includes run + standby
  const totalInstalledPower = items.reduce((acc, it) => acc + it.powerKw * (it.qtyRun + it.qtyStandby), 0);

  // Total operating power (P_hoạt động đồng thời tối đa): only running units
  const totalOperatingPower = items.reduce((acc, it) => acc + it.powerKw * it.qtyRun, 0);

  // P_tt = P_run_total * K_đt * K_sd
  const pCalculated = totalOperatingPower * simultaneityFactor * loadFactor;

  // Average cosPhi weighted by power
  const sumPowerCos = items.reduce((acc, it) => acc + (it.powerKw * it.qtyRun * it.cosPhi), 0);
  const avgCosPhi = totalOperatingPower > 0 ? (sumPowerCos / totalOperatingPower) : 0.85;

  // Apparent Power S_tt (kVA)
  const sCalculated = avgCosPhi > 0 ? pCalculated / avgCosPhi : 0;

  // Recommended Transformer Rating (kVA): 25, 30, 50, 75, 100, 160, 250, 400, 630...
  const STANDARD_TRANSFORMERS = [15, 25, 30, 50, 75, 100, 160, 200, 250, 315, 400, 500, 630, 800, 1000];
  const recTransformer = STANDARD_TRANSFORMERS.find(t => t >= sCalculated * 1.25) || Math.ceil(sCalculated * 1.3);

  // Rated Current I_tt (A)
  // For 3-phase 380V: I = P / (sqrt(3) * U * cosPhi) -> with U = 0.38 kV
  // For 1-phase 220V: I = P / (U * cosPhi)
  let calculatedCurrent = 0;
  if (voltage === 380) {
    calculatedCurrent = (pCalculated * 1000) / (Math.sqrt(3) * 380 * avgCosPhi);
  } else {
    calculatedCurrent = (pCalculated * 1000) / (220 * avgCosPhi);
  }

  // Recommended Main Circuit Breaker (MCCB): typically 1.25 to 1.5 x I_tt
  const STANDARD_MCCB = [16, 20, 25, 32, 40, 50, 63, 80, 100, 125, 160, 200, 250, 315, 400, 500, 630, 800];
  const recMccb = STANDARD_MCCB.find(cb => cb >= calculatedCurrent * 1.25) || Math.ceil(calculatedCurrent * 1.25);

  // Recommended Copper Cable Cross Section (Cu/XLPE/PVC)
  // Approximate standard ampacity for 3-phase copper cable in duct/tray:
  const CABLE_TABLE = [
    { size: 2.5, maxAmp: 25 },
    { size: 4.0, maxAmp: 34 },
    { size: 6.0, maxAmp: 44 },
    { size: 10.0, maxAmp: 60 },
    { size: 16.0, maxAmp: 80 },
    { size: 25.0, maxAmp: 105 },
    { size: 35.0, maxAmp: 130 },
    { size: 50.0, maxAmp: 160 },
    { size: 70.0, maxAmp: 200 },
    { size: 95.0, maxAmp: 245 },
    { size: 120.0, maxAmp: 285 },
    { size: 150.0, maxAmp: 325 },
    { size: 185.0, maxAmp: 370 },
    { size: 240.0, maxAmp: 435 },
    { size: 300.0, maxAmp: 500 },
  ];
  const recCable = CABLE_TABLE.find(c => c.maxAmp >= calculatedCurrent) || { size: 300, maxAmp: 500 };

  // Daily energy consumption (kWh/day) = sum(P_i * qtyRun * hours_i * loadFactor)
  const dailyEnergyKwh = items.reduce((acc, it) => acc + (it.powerKw * it.qtyRun * it.hoursPerDay * loadFactor), 0);
  const monthlyEnergyKwh = dailyEnergyKwh * 30;

  // Specific energy consumption per m3 wastewater: kWh / m3
  const specificEnergyKwhPerM3 = flow > 0 ? dailyEnergyKwh / flow : 0;

  // Monthly electricity cost
  const monthlyCostVnd = monthlyEnergyKwh * electricityTariff;

  return (
    <div className="space-y-6">
      {/* Header bar with presets */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-[#d6e3db] shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-[#193d2c]">Tính toán Điện & Năng lượng Trạm Nước Thải</h2>
            <p className="text-xs text-[#64786d]">Tổng công suất Pđặt, Ptt, dòng điện 380V, cáp điện đề xuất và suất tiêu hao điện (kWh/m³)</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-[#526a5c] font-medium hidden sm:inline">Mẫu công suất:</span>
          <button
            onClick={() => applyPreset('small')}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-[#f0f5f2] hover:bg-[#e2ece6] text-[#244b36] border border-[#c8d9ce] transition-colors"
          >
            Nhỏ (50 m³/ng)
          </button>
          <button
            onClick={() => applyPreset('medium')}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-[#f0f5f2] hover:bg-[#e2ece6] text-[#244b36] border border-[#c8d9ce] transition-colors"
          >
            Vừa (300 m³/ng)
          </button>
          <button
            onClick={() => applyPreset('large')}
            className="px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-[#f0f5f2] hover:bg-[#e2ece6] text-[#244b36] border border-[#c8d9ce] transition-colors"
          >
            Lớn (1500 m³/ng)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Equipment List (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-[#d6e3db] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#e5eee8] pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-[#176b45]" />
                <h3 className="text-sm font-bold text-[#183a2a]">Danh mục phụ tải thiết bị chính</h3>
              </div>
              <button
                type="button"
                onClick={addItem}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#176b45] text-white text-xs font-semibold hover:bg-[#125837] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Thêm thiết bị</span>
              </button>
            </div>

            {/* Equipment table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#e0ece4] text-[#4a6354] bg-[#f7faf8]">
                    <th className="py-2 px-2 font-bold">Tên thiết bị</th>
                    <th className="py-2 px-2 font-bold w-20">Công suất (kW)</th>
                    <th className="py-2 px-1 font-bold w-14 text-center">Chạy</th>
                    <th className="py-2 px-1 font-bold w-14 text-center">Dự phòng</th>
                    <th className="py-2 px-2 font-bold w-16 text-center">Giờ/ngày</th>
                    <th className="py-2 px-1 font-bold w-12 text-center">cosφ</th>
                    <th className="py-2 px-1 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf3ef]">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-[#fafcfb] transition-colors">
                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={item.name}
                          onChange={(e) => updateItem(item.id, 'name', e.target.value)}
                          className="w-full px-2 py-1 text-xs rounded border border-[#d2dfd6] focus:border-[#176b45] focus:outline-none"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <NumericInput
                          min={0.01}
                          defaultValue={item.powerKw}
                          value={item.powerKw}
                          onChange={(val) => updateItem(item.id, 'powerKw', val)}
                          className="w-full px-2 py-1 text-xs text-right font-bold rounded border border-[#d2dfd6]"
                        />
                      </td>
                      <td className="py-2 px-1">
                        <NumericInput
                          min={0}
                          defaultValue={item.qtyRun}
                          value={item.qtyRun}
                          onChange={(val) => updateItem(item.id, 'qtyRun', Math.round(val))}
                          className="w-full px-1 py-1 text-xs text-center font-bold rounded border border-[#d2dfd6]"
                        />
                      </td>
                      <td className="py-2 px-1">
                        <NumericInput
                          min={0}
                          defaultValue={item.qtyStandby}
                          value={item.qtyStandby}
                          onChange={(val) => updateItem(item.id, 'qtyStandby', Math.round(val))}
                          className="w-full px-1 py-1 text-xs text-center text-gray-500 rounded border border-[#d2dfd6]"
                        />
                      </td>
                      <td className="py-2 px-2">
                        <NumericInput
                          min={0}
                          max={24}
                          defaultValue={item.hoursPerDay}
                          value={item.hoursPerDay}
                          onChange={(val) => updateItem(item.id, 'hoursPerDay', val)}
                          className="w-full px-1 py-1 text-xs text-center rounded border border-[#d2dfd6]"
                        />
                      </td>
                      <td className="py-2 px-1">
                        <NumericInput
                          min={0.5}
                          max={1.0}
                          step={0.01}
                          defaultValue={item.cosPhi}
                          value={item.cosPhi}
                          onChange={(val) => updateItem(item.id, 'cosPhi', val)}
                          className="w-full px-1 py-1 text-xs text-center rounded border border-[#d2dfd6]"
                        />
                      </td>
                      <td className="py-2 px-1 text-center">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          title="Xóa thiết bị"
                          className="p-1 rounded text-red-500 hover:bg-red-50 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Quick system coefficients */}
            <div className="pt-3 border-t border-[#e5eee8] grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <label className="block text-[11px] font-semibold text-[#405a4b] mb-1">Q trạm (m³/ngày)</label>
                <NumericInput
                  min={1}
                  defaultValue={flow}
                  value={flow}
                  onChange={(val) => setFlow(val)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#cbd8d0] font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#405a4b] mb-1">K đồng thời (Kđt)</label>
                <NumericInput
                  min={0.3}
                  max={1.0}
                  step={0.05}
                  defaultValue={simultaneityFactor}
                  value={simultaneityFactor}
                  onChange={(val) => setSimultaneityFactor(val)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#cbd8d0] font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#405a4b] mb-1">K tải sử dụng (Ksd)</label>
                <NumericInput
                  min={0.3}
                  max={1.0}
                  step={0.05}
                  defaultValue={loadFactor}
                  value={loadFactor}
                  onChange={(val) => setLoadFactor(val)}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#cbd8d0] font-bold text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-[#405a4b] mb-1">Điện áp cấp (V)</label>
                <select
                  value={voltage}
                  onChange={(e) => setVoltage(Number(e.target.value))}
                  className="w-full px-2 py-1.5 rounded-lg border border-[#cbd8d0] font-bold text-xs bg-white text-[#193d2c]"
                >
                  <option value={380}>380V (3 pha)</option>
                  <option value={220}>220V (1 pha)</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Right column: Results & Specs (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {/* Main Power & Current Box */}
          <div className="bg-gradient-to-br from-[#f3f8f5] to-[#e7f1eb] p-5 rounded-2xl border border-[#c7dcd0] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#cfe0d6] pb-2">
              <span className="text-xs font-bold text-[#1e4833] uppercase tracking-wider">Tổng hợp Công suất & Dòng</span>
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white text-[#176b45] border border-[#c2d7cb]">
                {voltage === 380 ? 'Điện 3 pha 380V' : 'Điện 1 pha 220V'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-white rounded-xl border border-[#d6e5dc] space-y-0.5">
                <span className="text-[11px] text-[#556e60] block">Tổng P lắp đặt (Pđặt)</span>
                <div className="text-base font-extrabold text-[#176b45] tabular-nums">
                  {formatNumber(totalInstalledPower, 1)} <span className="text-xs font-semibold">kW</span>
                </div>
                <span className="text-[10px] text-gray-500">Bao gồm cả thiết bị dự phòng</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#d6e5dc] space-y-0.5">
                <span className="text-[11px] text-[#556e60] block">Công suất tính toán (Ptt)</span>
                <div className="text-base font-extrabold text-[#176b45] tabular-nums">
                  {formatNumber(pCalculated, 1)} <span className="text-xs font-semibold">kW</span>
                </div>
                <span className="text-[10px] text-gray-500">= Pchạy × {simultaneityFactor} × {loadFactor}</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-[#d6e5dc] space-y-0.5">
                <span className="text-[11px] text-[#556e60] block">Công suất biểu kiến (Stt)</span>
                <div className="text-base font-extrabold text-[#234333] tabular-nums">
                  {formatNumber(sCalculated, 1)} <span className="text-xs font-semibold">kVA</span>
                </div>
                <span className="text-[10px] text-gray-500">cosφ tb ≈ {formatNumber(avgCosPhi, 2)}</span>
              </div>

              <div className="p-3 bg-white rounded-xl border border-amber-200 bg-amber-50/50 space-y-0.5">
                <span className="text-[11px] text-amber-900 block font-semibold">Dòng điện tính toán (Itt)</span>
                <div className="text-base font-extrabold text-amber-700 tabular-nums">
                  {formatNumber(calculatedCurrent, 1)} <span className="text-xs font-semibold">A</span>
                </div>
                <span className="text-[10px] text-amber-800">Dòng phụ tải tổng</span>
              </div>
            </div>

            {/* Recommended Electrical Hardware */}
            <div className="p-3.5 bg-white rounded-xl border border-[#cde0d5] space-y-2 text-xs">
              <div className="text-[11px] font-bold text-[#1c422f] uppercase tracking-wider">
                Quy cách thiết bị cấp nguồn đề xuất
              </div>
              <div className="space-y-1.5 text-xs text-[#2c4b3a]">
                <div className="flex justify-between items-center py-1 border-b border-[#edf3ef]">
                  <span className="text-[#556e60]">Aptomat tổng (MCCB):</span>
                  <strong className="font-extrabold text-[#176b45]">{recMccb} A (3P)</strong>
                </div>
                <div className="flex justify-between items-center py-1 border-b border-[#edf3ef]">
                  <span className="text-[#556e60]">Cáp đồng nguồn (Cu/XLPE/PVC):</span>
                  <strong className="font-extrabold text-[#176b45]">
                    {recCable.size} mm² (Icp ≈ {recCable.maxAmp}A)
                  </strong>
                </div>
                <div className="flex justify-between items-center py-1">
                  <span className="text-[#556e60]">Máy biến áp đề xuất:</span>
                  <strong className="font-extrabold text-[#176b45]">≥ {recTransformer} kVA</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Energy & Operating Cost Box */}
          <div className="bg-white p-5 rounded-2xl border border-[#d6e3db] shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-[#e5eee8] pb-2">
              <span className="text-xs font-bold text-[#1e4833] uppercase tracking-wider">Tiêu hao điện & Chi phí EVN</span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#556e60]">Điện năng tiêu thụ/ngày:</span>
                <strong className="font-extrabold text-sm text-[#176b45] tabular-nums">
                  {formatNumber(dailyEnergyKwh, 1)} kWh/ngày
                </strong>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[#556e60]">Điện năng tiêu thụ/tháng:</span>
                <strong className="font-extrabold text-sm text-[#234333] tabular-nums">
                  {formatNumber(monthlyEnergyKwh, 0)} kWh/tháng
                </strong>
              </div>

              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-950 flex justify-between items-center">
                <div>
                  <div className="text-[11px] font-bold text-emerald-900">Suất tiêu hao điện (kWh/m³):</div>
                  <div className="text-[10px] text-emerald-700">Chỉ số năng lượng chuẩn trạm xử lý</div>
                </div>
                <div className="text-lg font-extrabold text-emerald-700 tabular-nums">
                  {formatNumber(specificEnergyKwhPerM3, 2)} <span className="text-xs font-semibold">kWh/m³</span>
                </div>
              </div>

              {/* Specific power benchmark check */}
              <div className="text-[11px] text-[#486354] bg-[#f8faf8] p-2.5 rounded-lg border border-[#e1ece5] space-y-1">
                <div className="font-semibold text-[#1f4532]">Đánh giá hiệu suất năng lượng:</div>
                <div className="text-[10px] leading-relaxed">
                  {specificEnergyKwhPerM3 < 0.8
                    ? '• Mức tiêu hao điện RẤT TỐT (< 0.8 kWh/m³). Tiết kiệm năng lượng cao.'
                    : specificEnergyKwhPerM3 <= 1.5
                    ? '• Mức tiêu hao điện TIÊU CHUẨN (0.8 - 1.5 kWh/m³) cho công nghệ hiếu khí sinh học Aerotank/MBBR.'
                    : '• Mức tiêu hao điện KHÁ CAO (> 1.5 kWh/m³). Thường gặp ở trạm có MBR, UV hoặc thổi khí dư thừa.'}
                </div>
              </div>

              {/* Monthly cost */}
              <div className="pt-2 border-t border-[#e5eee8] space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-semibold text-[#405a4b]">Đơn giá điện EVN bình quân:</label>
                  <div className="w-28">
                    <NumericInput
                      min={1000}
                      step={50}
                      defaultValue={electricityTariff}
                      value={electricityTariff}
                      onChange={(val) => setElectricityTariff(val)}
                      className="w-full px-2 py-1 text-xs text-right font-bold rounded border border-[#cbd8d0]"
                    />
                  </div>
                </div>

                <div className="p-3 bg-[#fafcfb] rounded-xl border border-[#d6e3db] flex justify-between items-center">
                  <span className="text-xs font-bold text-[#183a2a]">Ước tính tiền điện/tháng:</span>
                  <strong className="text-base font-extrabold text-red-600 tabular-nums">
                    {formatNumber(monthlyCostVnd, 0)} đ
                  </strong>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
