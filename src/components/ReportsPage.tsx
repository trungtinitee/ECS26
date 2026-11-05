import React, { useState, useEffect } from 'react';
import { ArrowLeft, Printer, Download, FileText, CheckCircle2 } from 'lucide-react';
import { ProjectInfo, WastewaterInputs, WastewaterCalculationResults, TechnologyUnit } from '../types/ecs';
import { EcsLogoIcon } from './common/EcsLogo';
import {
  formatNumber,
  POLLUTANTS,
  calculatePumpWell,
  calculateEqualization,
  calculateAerotank,
  calculateSecondaryClarifier,
  calculateDisinfection,
  calculateAnoxic,
  calculateSludgeTank,
  calculateGenericUnit,
  calculateBarScreen,
  calculateGritChamber,
  calculateGreaseTrap,
  calculateCoagulation,
  calculateFlocculation,
  calculateDaf,
  calculateSbr,
  calculateMbr,
  calculateMbbr,
  calculateUasb,
  calculateChemicalClarifier,
  calculateSandFilter,
  calculateFilterPress,
} from '../utils/calculations';

interface ReportsPageProps {
  project: ProjectInfo;
  inputs: WastewaterInputs;
  results: WastewaterCalculationResults;
  units: TechnologyUnit[];
  onBack: () => void;
}

export const ReportsPage: React.FC<ReportsPageProps> = ({
  project,
  inputs,
  results,
  units,
  onBack,
}) => {
  const [, setPrecisionTick] = useState(0);

  useEffect(() => {
    const handler = () => setPrecisionTick((t) => t + 1);
    window.addEventListener('ecs-decimal-precision-changed', handler);
    return () => window.removeEventListener('ecs-decimal-precision-changed', handler);
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-[1040px] mx-auto px-4 py-6 pb-20 animate-fadeIn space-y-6">
      {/* Top action bar - hidden during print */}
      <div className="flex items-center justify-between gap-3 print:hidden">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#cbd8d0] bg-[#f5f8f6] text-[#28573d] text-xs font-semibold hover:bg-[#eaf3ee] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>← Quay lại công cụ nước thải</span>
        </button>

        <button
          type="button"
          onClick={handlePrint}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#176b45] text-white text-xs font-bold hover:bg-[#105a39] shadow-sm transition-all"
        >
          <Printer className="w-4 h-4" />
          <span>In / Xuất PDF báo cáo</span>
        </button>
      </div>

      {/* Main Report Document Card */}
      <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm p-8 sm:p-12 space-y-8 print:border-0 print:shadow-none print:p-0">
        {/* Document Header */}
        <div className="border-b-2 border-[#176b45] pb-6 space-y-3">
          <div className="flex items-center justify-between text-xs text-[#63776d]">
            <div className="flex items-center gap-2">
              <EcsLogoIcon size={24} />
              <span className="font-bold text-[#176b45]">HỆ THỐNG TÍNH TOÁN KỸ THUẬT MÔI TRƯỜNG ECS</span>
            </div>
            <span>HỆ ĐƠN VỊ: SI / QUY CHUẨN: QCVN</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-[#173827] tracking-tight uppercase">
            Báo cáo Thuyết minh Tính toán Công nghệ
          </h1>

          <div className="text-sm font-bold text-[#176b45]">
            Dự án: {project.name || 'Dự án mới'}
          </div>
        </div>

        {/* Section 1: Thông tin dự án */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#176b45] border-b border-[#e2ede6] pb-1.5">
            I. THÔNG TIN CHUNG DỰ ÁN
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-[#64786d]">Chủ đầu tư: </span>
              <strong className="text-[#1a3a2a]">{project.owner || '—'}</strong>
            </div>
            <div>
              <span className="text-[#64786d]">Người liên hệ: </span>
              <strong className="text-[#1a3a2a]">{project.contact || '—'}</strong>
            </div>
            <div>
              <span className="text-[#64786d]">Địa điểm xây dựng: </span>
              <strong className="text-[#1a3a2a]">{project.location || '—'}</strong>
            </div>
            <div>
              <span className="text-[#64786d]">Đơn vị thiết kế: </span>
              <strong className="text-[#1a3a2a]">{project.designCompany || '—'}</strong>
            </div>
            <div className="sm:col-span-2">
              <span className="text-[#64786d]">Mô tả phạm vi: </span>
              <span className="text-[#1a3a2a]">{project.description || 'Không có ghi chú thêm.'}</span>
            </div>
          </div>
        </section>

        {/* Section 2: Đặc tính nước thải & Tải lượng */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#176b45] border-b border-[#e2ede6] pb-1.5">
            II. THÔNG SỐ NGUỒN THẢI & TẢI LƯỢNG Ô NHIỄM
          </h2>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
            <div className="p-3 rounded-xl bg-[#f7faf8] border border-[#e2ece5]">
              <div className="text-[#65796e]">Lưu lượng ngày Qtb</div>
              <div className="text-base font-extrabold text-[#176b45] mt-0.5">
                {formatNumber(results.q)} m³/ngày
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#f7faf8] border border-[#e2ece5]">
              <div className="text-[#65796e]">Lưu lượng giờ đỉnh Qh</div>
              <div className="text-base font-extrabold text-[#176b45] mt-0.5">
                {formatNumber(results.qh)} m³/giờ
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#f7faf8] border border-[#e2ece5]">
              <div className="text-[#65796e]">Hệ số Kpeak</div>
              <div className="text-base font-extrabold text-[#176b45] mt-0.5">
                {formatNumber(inputs.kpeak)}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-[#f7faf8] border border-[#e2ece5]">
              <div className="text-[#65796e]">Thời gian hoạt động</div>
              <div className="text-base font-extrabold text-[#176b45] mt-0.5">
                {formatNumber(inputs.hours)} h/ngày
              </div>
            </div>
          </div>

          <table className="w-full text-left border-collapse text-xs border border-[#e2ede6]">
            <thead>
              <tr className="bg-[#f3f7f4] border-b border-[#e2ede6] text-[#4d6356] font-bold">
                <th className="py-2.5 px-4">Chỉ tiêu</th>
                <th className="py-2.5 px-4 text-right">Nồng độ vào (mg/L)</th>
                <th className="py-2.5 px-4 text-right">Tải lượng (kg/ngày)</th>
                <th className="py-2.5 px-4 text-right">QCVN 40 Cột A</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#edf3ef] text-[#20362b]">
              {POLLUTANTS.map((p) => (
                <tr key={p.key}>
                  <td className="py-2 px-4 font-semibold">{p.label}</td>
                  <td className="py-2 px-4 text-right font-bold tabular-nums">
                    {formatNumber((inputs as any)[p.key])}
                  </td>
                  <td className="py-2 px-4 text-right font-bold tabular-nums text-[#176b45]">
                    {formatNumber((results.loads as any)[p.key])}
                  </td>
                  <td className="py-2 px-4 text-right tabular-nums text-[#687e71]">
                    {p.qcvn40_A ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* Section 3: Dây chuyền công nghệ đã chọn */}
        <section className="space-y-3">
          <h2 className="text-sm font-bold uppercase tracking-wider text-[#176b45] border-b border-[#e2ede6] pb-1.5">
            III. DÂY CHUYỀN CÔNG NGHỆ & KÍCH THƯỚC CÔNG TRÌNH
          </h2>

          {units.length === 0 ? (
            <p className="text-xs text-gray-500 italic">Chưa có công trình nào trong dây chuyền.</p>
          ) : (
            <div className="space-y-3">
              {units.map((u, i) => {
                let dimInfo = 'Chưa xác định kích thước chi tiết';
                let volInfo = '—';

                if (u.catalogName === 'Hầm bơm' && u.data?.pumpWell) {
                  const res = calculatePumpWell(u.data.pumpWell);
                  if (res.valid) {
                    dimInfo =
                      u.data.pumpWell.geometry === 'circle'
                        ? `Đường kính D = ${formatNumber(res.diameter)} m × Chiều sâu H = ${formatNumber(res.totalHeight)} m`
                        : `Dài L = ${formatNumber(res.length)} m × Rộng B = ${formatNumber(res.width)} m × Sâu H = ${formatNumber(res.totalHeight)} m`;
                    volInfo = `Dung tích hữu dụng: ${formatNumber(res.actual)} m³ (yêu cầu: ${formatNumber(res.required)} m³) | Thời gian lưu: ${formatNumber(u.data.pumpWell.storageMinutes)} phút`;
                  }
                } else if (u.catalogName === 'Bể điều hòa' && u.data?.equalizationTank) {
                  const res = calculateEqualization(u.data.equalizationTank);
                  if (res.valid) {
                    const eq = u.data.equalizationTank;
                    dimInfo = eq.geometry === 'circle'
                      ? `Đường kính D = ${formatNumber(eq.width)} m × Chiều cao H = ${formatNumber(res.totalHeight)} m (H nước: ${formatNumber(eq.waterDepth)} m)`
                      : `Dài L = ${formatNumber(eq.length)} m × Rộng B = ${formatNumber(eq.width)} m × Cao H = ${formatNumber(res.totalHeight)} m (H nước: ${formatNumber(eq.waterDepth)} m)`;
                    const equipMix = eq.mixingMethod === 'mixer'
                      ? `Máy khuấy chìm: ${eq.numMixers} cái × ${formatNumber(res.powerPerMixer)} kW`
                      : `Máy thổi khí xáo trộn: ${formatNumber(res.airFlowTotalM3h)} m³/h`;
                    const equipPump = `Bơm chìm: ${eq.numPumpsWork} chạy + ${eq.numPumpsStandby} dự phòng (Q = ${formatNumber(res.pumpFlowRate)} m³/h, H = ${formatNumber(eq.pumpHead)} m, P = ${formatNumber(res.pumpPowerMotor)} kW)`;
                    volInfo = `Dung tích hữu dụng: ${formatNumber(res.actual)} m³ (yêu cầu: ${formatNumber(res.required)} m³) | HRT: ${formatNumber(res.actualHrt)} h | ${equipMix} | ${equipPump}`;
                  }
                } else if (u.catalogName === 'Bể Aerotank' && u.data?.aerotank) {
                  const res = calculateAerotank(u.data.aerotank);
                  if (res.valid) {
                    const aero = u.data.aerotank;
                    dimInfo = `Dài L = ${formatNumber(aero.length)} m × Rộng B = ${formatNumber(aero.width)} m × Sâu H = ${formatNumber(res.totalHeight)} m (H nước: ${formatNumber(aero.waterDepth)} m)`;
                    const equipBlow = `Máy thổi khí Root blower: ${aero.numBlowersWork} chạy + ${aero.numBlowersStandby} dự phòng (Q = ${formatNumber(res.airFlowM3h)} m³/h, P = ${formatNumber(res.blowerPowerKw)} kW)`;
                    const equipDiff = `Đĩa phân phối khí bọt mịn: ${res.diffuserCount} đĩa (D270mm)`;
                    const nitInfo = res.includeNitrification
                      ? ` | Nitrat hóa: N-NH₄⁺ ${formatNumber(res.nh4In)}→${formatNumber(res.nh4Out)} mg/L (NOD: ${formatNumber(res.o2NitrificationDaily)} kg O₂/d, θc_min: ${formatNumber(res.minSrtDays)} ngày, Kiềm dư: ${formatNumber(res.residualAlkalinityMgL)} mg/L)`
                      : '';
                    volInfo = `Dung tích hữu dụng: ${formatNumber(res.actual)} m³ (yêu cầu: ${formatNumber(res.required)} m³) | HRT: ${formatNumber(res.actualHrt)} h | Tổng O₂: ${formatNumber(res.o2Daily)} kg/ngày (CBOD: ${formatNumber(res.o2CbodDaily)} kg/d)${nitInfo} | ${equipBlow} | ${equipDiff}`;
                  }
                } else if (u.catalogName === 'Bể lắng sinh học' && u.data?.secondaryClarifier) {
                  const res = calculateSecondaryClarifier(u.data.secondaryClarifier);
                  if (res.valid) {
                    const sc = u.data.secondaryClarifier;
                    dimInfo = sc.geometry === 'circle'
                      ? `Bể lắng tròn: Đường kính D = ${formatNumber(sc.diameter)} m × Sâu H = ${formatNumber(res.totalHeight)} m (Ống trung tâm D = ${formatNumber(res.centralWellDiameter)} m)`
                      : `Bể lắng chữ nhật: L = ${formatNumber(sc.length)} m × B = ${formatNumber(sc.width)} m × H = ${formatNumber(res.totalHeight)} m`;
                    const equipRas = `Bơm bùn tuần hoàn RAS: ${sc.numRasPumpsWork} chạy + ${sc.numRasPumpsStandby} dự phòng (Q = ${formatNumber(res.rasFlowRate)} m³/h)`;
                    const equipWeir = `Máng thu nước răng cưa V-notch: Chiều dài L = ${formatNumber(res.weirLength)} m (Tải trọng: ${formatNumber(res.weirLoadingRate)} m³/m·h)`;
                    volInfo = `Dung tích: ${formatNumber(res.actualVolume)} m³ (F = ${formatNumber(res.actualArea)} m²) | Tải bề mặt q₀: ${formatNumber(res.actualQ0)} m³/m²·h | Thời gian lắng: ${formatNumber(res.retentionHours)} h | ${equipRas} | ${equipWeir}`;
                  }
                } else if (u.catalogName === 'Bể khử trùng' && u.data?.disinfectionTank) {
                  const res = calculateDisinfection(u.data.disinfectionTank);
                  if (res.valid) {
                    const dis = u.data.disinfectionTank;
                    dimInfo = `Dài L = ${formatNumber(dis.length)} m × Rộng B = ${formatNumber(dis.width)} m × Sâu H = ${formatNumber(res.totalHeight)} m (${dis.channels} ngăn zic-zac)`;
                    const equipDosing = `Bơm định lượng Javel: ${dis.chemicalPumpWork} chạy + ${dis.chemicalPumpStandby} dự phòng (Q = ${formatNumber(res.dosingPumpLitersHour)} L/h)`;
                    const equipTank = `Bồn hóa chất PE: dung tích yêu cầu ≥ ${formatNumber(res.storageLitersRequired)} Lít (${formatNumber(dis.storageDays)} ngày dự trữ)`;
                    volInfo = `Dung tích hữu dụng: ${formatNumber(res.actualVolume)} m³ | Thời gian tiếp xúc: ${formatNumber(res.actualContactTime)} phút | Hóa chất Javel 10%: ${formatNumber(res.javelLitersDay)} L/ngày | ${equipDosing} | ${equipTank}`;
                  }
                } else if (u.catalogName === 'Bể Anoxic' && u.data?.anoxicTank) {
                  const res = calculateAnoxic(u.data.anoxicTank);
                  if (res.valid) {
                    const an = u.data.anoxicTank;
                    dimInfo = `Dài L = ${formatNumber(an.length)} m × Rộng B = ${formatNumber(an.width)} m × Sâu H = ${formatNumber(res.totalHeight)} m`;
                    const equipMix = `Máy khuấy chìm: ${an.numMixers} cái × ${formatNumber(res.mixingPowerPerMixer)} kW`;
                    const equipPump = `Bơm tuần hoàn nitrat: ${an.numRecyclePumpsWork} chạy + ${an.numRecyclePumpsStandby} dự phòng (Q = ${formatNumber(res.recycleFlowRate)} m³/h, R = ${formatNumber(an.recycleRatio * 100, 0)}%)`;
                    volInfo = `Dung tích: ${formatNumber(res.actualVolume)} m³ | HRT: ${formatNumber(res.actualHrt)} h | Khử N: ${formatNumber(res.denitEfficiency)}% (Khử ${formatNumber(res.nitrateRemovedKgDay)} kg N/d) | O₂ hoàn hồi: ${formatNumber(res.o2CreditKgDay)} kg/d | Kiềm hoàn hồi: ${formatNumber(res.alkalinityRecoveredKgDay)} kg/d | BOD/TKN: ${formatNumber(res.bodToTknRatio)} | ${equipMix} | ${equipPump}`;
                  }
                } else if (['Bể chứa bùn', 'Bể nén bùn'].includes(u.catalogName) && u.data?.sludgeTank) {
                  const res = calculateSludgeTank(u.data.sludgeTank);
                  if (res.valid) {
                    const st = u.data.sludgeTank;
                    dimInfo = st.geometry === 'circle'
                      ? `Đường kính D = ${formatNumber(st.diameter)} m × Sâu H = ${formatNumber(res.totalHeight)} m (Phễu gom bùn sâu: ${formatNumber(st.hopperDepth)} m)`
                      : `Dài L = ${formatNumber(st.length)} m × Rộng B = ${formatNumber(st.width)} m × Sâu H = ${formatNumber(res.totalHeight)} m (Phễu bùn sâu: ${formatNumber(st.hopperDepth)} m)`;
                    const equipPump = `Bơm trục vít ép bùn: ${st.numScrewPumpsWork} chạy + ${st.numScrewPumpsStandby} dự phòng (Q = ${formatNumber(res.screwPumpFlowRate)} m³/h)`;
                    const equipAir = `Sục khí chống thối: Q = ${formatNumber(res.airFlowM3h)} m³/h`;
                    volInfo = `Dung tích: ${formatNumber(res.actualVolume)} m³ | Thời gian lưu bùn: ${formatNumber(st.storageDays)} ngày | Bùn nén phát sinh: ${formatNumber(res.thickenedSludgePerDay)} m³/ngày | ${equipPump} | ${equipAir}`;
                  }
                } else if (u.catalogName === 'Song chắn rác' && u.data?.barScreen) {
                  const res = calculateBarScreen(u.data.barScreen);
                  if (res.valid) {
                    const bs = u.data.barScreen;
                    dimInfo = `Máng dẫn: Bề rộng B = ${formatNumber(bs.channelWidth)} m × Sâu h = ${formatNumber(bs.waterDepth)} m × Tổng cao H = ${formatNumber(res.totalHeight)} m`;
                    volInfo = `Khe song: ${formatNumber(bs.barSpacingMm)} mm (${res.numBars} thanh inox) | Vận tốc qua khe: ${formatNumber(res.actualVelocity)} m/s | Tổn thất áp lực: ${formatNumber(res.headLossMm)} mm`;
                  }
                } else if (u.catalogName === 'Bể lắng cát' && u.data?.gritChamber) {
                  const res = calculateGritChamber(u.data.gritChamber);
                  if (res.valid) {
                    const gc = u.data.gritChamber;
                    dimInfo = `Dài L = ${formatNumber(gc.length)} m × Rộng B = ${formatNumber(gc.width)} m × Sâu H = ${formatNumber(res.totalHeight)} m`;
                    volInfo = `Thể tích: ${formatNumber(res.actualVolume)} m³ | Thời gian lưu: ${formatNumber(res.actualRetentionSeconds)} s | Vận tốc ngang: ${formatNumber(res.actualVelocity)} m/s | Lượng cát sinh: ${formatNumber(res.gritYieldPerDayLiters)} L/ngày`;
                  }
                } else if (u.catalogName === 'Bể tách dầu mỡ' && u.data?.greaseTrap) {
                  const res = calculateGreaseTrap(u.data.greaseTrap);
                  if (res.valid) {
                    const gt = u.data.greaseTrap;
                    dimInfo = `Dài L = ${formatNumber(gt.length)} m × Rộng B = ${formatNumber(gt.width)} m × Sâu H = ${formatNumber(res.totalHeight)} m`;
                    volInfo = `Thể tích: ${formatNumber(res.actualVolume)} m³ | Thời gian lưu: ${formatNumber(res.actualRetentionMin)} phút | Tải trọng bề mặt: ${formatNumber(res.actualQ0)} m³/m²·h | Tỉ lệ L/B: ${formatNumber(res.lengthWidthRatio)}`;
                  }
                } else if (['Bể keo tụ', 'Bể phản ứng'].includes(u.catalogName) && u.data?.coagulationTank) {
                  const res = calculateCoagulation(u.data.coagulationTank);
                  if (res.valid) {
                    const cg = u.data.coagulationTank;
                    dimInfo = `Dài L = ${formatNumber(cg.length)} m × Rộng B = ${formatNumber(cg.width)} m × Sâu H = ${formatNumber(res.totalHeight)} m`;
                    volInfo = `Thể tích: ${formatNumber(res.actualVolume)} m³ | Thời gian khuấy: ${formatNumber(res.actualRetentionSec)} s | Gradient G: ${formatNumber(cg.velocityGradientG)} s⁻¹ | Máy khuấy nhanh: ${formatNumber(res.mixingPowerKw)} kW`;
                  }
                } else if (u.catalogName === 'Bể tạo bông' && u.data?.flocculationTank) {
                  const res = calculateFlocculation(u.data.flocculationTank);
                  if (res.valid) {
                    const fl = u.data.flocculationTank;
                    dimInfo = `Dài L = ${formatNumber(fl.length)} m × Rộng B = ${formatNumber(fl.width)} m × Sâu H = ${formatNumber(res.totalHeight)} m (${fl.stages} ngăn)`;
                    volInfo = `Thể tích tổng: ${formatNumber(res.actualVolume)} m³ (Mỗi ngăn: ${formatNumber(res.compartmentVolume)} m³) | Thời gian tạo bông: ${formatNumber(res.actualRetentionMin)} phút | Máy khuấy chậm biến tần`;
                  }
                } else if (u.catalogName === 'Bể tuyển nổi DAF' && u.data?.daf) {
                  const res = calculateDaf(u.data.daf);
                  if (res.valid) {
                    const df = u.data.daf;
                    dimInfo = `Dài L = ${formatNumber(df.length)} m × Rộng B = ${formatNumber(df.width)} m × Sâu H = ${formatNumber(res.totalHeight)} m`;
                    volInfo = `Thể tích: ${formatNumber(res.volumeM3)} m³ | Mặt thoáng: ${formatNumber(res.actualArea)} m² | Tuần hoàn: ${formatNumber(res.recycleFlowM3h)} m³/h (R=${formatNumber(df.recycleRatio)}%) | Áp suất bão hòa: ${formatNumber(df.saturationPressureBar)} bar`;
                  }
                } else if (u.catalogName === 'Bể SBR' && u.data?.sbr) {
                  const res = calculateSbr(u.data.sbr);
                  if (res.valid) {
                    const sb = u.data.sbr;
                    dimInfo = `${sb.numTanks} bể × [Dài L = ${formatNumber(sb.length)} m × Rộng B = ${formatNumber(sb.width)} m × Sâu H = ${formatNumber(res.totalHeight)} m]`;
                    volInfo = `Thể tích: ${formatNumber(res.actualVolumePerTank)} m³/bể (Tổng: ${formatNumber(res.totalVolumeAllTanks)} m³) | Chu kỳ: ${formatNumber(sb.cycleHours)} h | HWL: ${formatNumber(res.waterHighLevel)} m, LWL: ${formatNumber(res.waterLowLevel)} m | Gạn Decanter`;
                  }
                } else if (u.catalogName === 'Bể MBR' && u.data?.mbr) {
                  const res = calculateMbr(u.data.mbr);
                  if (res.valid) {
                    const mb = u.data.mbr;
                    dimInfo = `Dài L = ${formatNumber(mb.length)} m × Rộng B = ${formatNumber(mb.width)} m × Sâu H = ${formatNumber(res.totalHeight)} m`;
                    volInfo = `Thể tích: ${formatNumber(res.actualVolume)} m³ | HRT: ${formatNumber(res.actualHrt)} h | Diện tích màng: ${formatNumber(res.requiredMembraneAreaM2)} m² (Flux: ${formatNumber(mb.membraneFluxLmh)} LMH) | MLSS: ${formatNumber(mb.mlss)} mg/L`;
                  }
                } else if (u.catalogName === 'Bể MBBR' && u.data?.mbbr) {
                  const res = calculateMbbr(u.data.mbbr);
                  if (res.valid) {
                    const mbb = u.data.mbbr;
                    dimInfo = `Dài L = ${formatNumber(mbb.length)} m × Rộng B = ${formatNumber(mbb.width)} m × Sâu H = ${formatNumber(res.totalHeight)} m`;
                    volInfo = `Thể tích: ${formatNumber(res.actualTankVolumeM3)} m³ | HRT: ${formatNumber(res.actualHrt)} h | Khối lượng giá thể: ${formatNumber(res.requiredMediaVolumeM3)} m³ (Điền đầy: ${formatNumber(mbb.fillingFraction)}%) | SALR: ${formatNumber(mbb.salr)} g/m²·d`;
                  }
                } else if (u.catalogName === 'Bể UASB' && u.data?.uasb) {
                  const res = calculateUasb(u.data.uasb);
                  if (res.valid) {
                    const ua = u.data.uasb;
                    dimInfo = `Dài L = ${formatNumber(ua.length)} m × Rộng B = ${formatNumber(ua.width)} m × Sâu H = ${formatNumber(res.totalHeight)} m`;
                    volInfo = `Thể tích: ${formatNumber(res.actualVolume)} m³ | VLR: ${formatNumber(ua.volumetricLoadingCod)} kg COD/m³·d | Vận tốc dâng: ${formatNumber(res.actualUpflowVelocity)} m/h | Thu hồi Biogas: ${formatNumber(res.biogasYieldM3Day)} m³/ngày`;
                  }
                } else if (u.catalogName === 'Bể lắng hóa lý' && u.data?.chemicalClarifier) {
                  const res = calculateChemicalClarifier(u.data.chemicalClarifier);
                  if (res.valid) {
                    const cc = u.data.chemicalClarifier;
                    dimInfo = cc.geometry === 'circle'
                      ? `Đường kính D = ${formatNumber(cc.diameter)} m × Sâu H = ${formatNumber(res.totalHeight)} m`
                      : `Dài L = ${formatNumber(cc.length)} m × Rộng B = ${formatNumber(cc.width)} m × Sâu H = ${formatNumber(res.totalHeight)} m`;
                    volInfo = `Thể tích: ${formatNumber(res.actualVolume)} m³ | Mặt thoáng: ${formatNumber(res.actualArea)} m² | q₀: ${formatNumber(res.actualQ0)} m³/m²·h | Tải máng tràn weir: ${formatNumber(res.weirLoadingRate)} m³/m·h`;
                  }
                } else if (['Bể lọc áp lực', 'Lọc than hoạt tính'].includes(u.catalogName) && u.data?.sandFilter) {
                  const res = calculateSandFilter(u.data.sandFilter);
                  if (res.valid) {
                    const sf = u.data.sandFilter;
                    dimInfo = `${sf.numColumns} bồn × [Đường kính Ø ${formatNumber(sf.diameter * 1000)} mm × Cao H = ${formatNumber(sf.height * 1000)} mm]`;
                    volInfo = `Tổng diện tích lọc: ${formatNumber(res.actualAreaM2)} m² | Vận tốc lọc: ${formatNumber(res.actualVelocity)} m/h | Thời gian tiếp xúc rỗng EBCT: ${formatNumber(res.ebctMinutes)} phút`;
                  }
                } else if (u.catalogName === 'Máy ép bùn' && u.data?.filterPress) {
                  const res = calculateFilterPress(u.data.filterPress);
                  if (res.valid) {
                    const fp = u.data.filterPress;
                    dimInfo = `Máy ép bùn công suất Q = ${formatNumber(fp.capacityM3H)} m³/h (Chế độ vận hành ${formatNumber(fp.operatingHoursPerDay)} h/ngày)`;
                    volInfo = `Bùn khô: ${formatNumber(res.drySolidsKgDay)} kg DS/ngày | Bánh bùn ép: ${formatNumber(res.sludgeCakeM3Day)} m³/ngày (${formatNumber(res.sludgeCakeKgDay)} kg/ngày) | Polymer Cation: ${formatNumber(res.polymerConsumptionKgDay)} kg/ngày`;
                  }
                } else if (u.data?.genericUnit) {
                  const res = calculateGenericUnit(u.data.genericUnit);
                  if (res.valid) {
                    const gu = u.data.genericUnit;
                    dimInfo = `Dài L = ${formatNumber(gu.length)} m × Rộng B = ${formatNumber(gu.width)} m × Sâu H = ${formatNumber(res.totalHeight)} m`;
                    volInfo = `Dung tích hữu dụng: ${formatNumber(res.actualVolume)} m³ | Thời gian lưu: ${formatNumber(res.actualRetention)} ${gu.retentionUnit} | ${gu.equipmentSummary}`;
                  }
                }

                return (
                  <div key={u.id} className="p-3.5 rounded-xl border border-[#d6e3db] bg-[#fbfdfc] text-xs">
                    <div className="flex items-center justify-between font-bold text-sm text-[#183a2a]">
                      <span>
                        {i + 1}. {u.name} ({u.catalogName})
                      </span>
                      <span className="text-[11px] font-semibold text-[#176b45]">
                        {u.status === 'done' ? '✓ Đã tính' : 'Chưa tính'}
                      </span>
                    </div>
                    <div className="mt-1 text-[#465d50]">{dimInfo}</div>
                    <div className="mt-0.5 text-[#176b45] font-semibold">{volInfo}</div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Signatures */}
        <div className="pt-8 grid grid-cols-2 text-center text-xs text-[#20342b]">
          <div>
            <div className="font-bold">ĐẠI DIỆN CHỦ ĐẦU TƯ</div>
            <div className="text-[11px] text-[#718579] italic mt-1">(Ký và ghi rõ họ tên)</div>
          </div>
          <div>
            <div className="font-bold">ĐẠI DIỆN ĐƠN VỊ THIẾT KẾ</div>
            <div className="text-[11px] text-[#718579] italic mt-1">(Ký và ghi rõ họ tên)</div>
          </div>
        </div>
      </div>
    </div>
  );
};
