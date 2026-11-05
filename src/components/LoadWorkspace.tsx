import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { WastewaterInputs, WastewaterCalculationResults } from '../types/ecs';
import { formatNumber, POLLUTANTS } from '../utils/calculations';
import { NumericInput } from './common/NumericInput';

interface LoadWorkspaceProps {
  inputs: WastewaterInputs;
  projectType: string;
  otherWastewaterType?: string;
  onUpdateInput: (key: keyof WastewaterInputs, val: number | null) => void;
  onUpdateProjectType: (type: string, otherName?: string) => void;
  results: WastewaterCalculationResults;
  validationErrors: string[];
  onBack: () => void;
}

export const LoadWorkspace: React.FC<LoadWorkspaceProps> = ({
  inputs,
  projectType,
  otherWastewaterType,
  onUpdateInput,
  onUpdateProjectType,
  results,
  validationErrors,
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<'input' | 'results'>('input');
  const [, setPrecisionTick] = useState(0);

  useEffect(() => {
    const handler = () => setPrecisionTick((t) => t + 1);
    window.addEventListener('ecs-decimal-precision-changed', handler);
    return () => window.removeEventListener('ecs-decimal-precision-changed', handler);
  }, []);

  const handleNumberChange = (key: keyof WastewaterInputs, valStr: string) => {
    if (valStr.trim() === '') {
      onUpdateInput(key, null);
    } else {
      const parsed = parseFloat(valStr);
      onUpdateInput(key, isNaN(parsed) ? null : parsed);
    }
  };

  const bodCod = results.bodCodRatio;
  let bioAssessment = 'Chưa xác định';
  let bioColor = 'text-gray-600 bg-gray-50 border-gray-200';
  if (bodCod !== null) {
    if (bodCod >= 0.5) {
      bioAssessment = 'Rất thích hợp cho quá trình xử lý sinh học hiếu khí (BOD/COD ≥ 0.5)';
      bioColor = 'text-[#176b45] bg-[#e8f3ed] border-[#c4dcce]';
    } else if (bodCod >= 0.3) {
      bioAssessment = 'Có thể xử lý sinh học kết hợp hoặc tiền xử lý hóa lý (0.3 ≤ BOD/COD < 0.5)';
      bioColor = 'text-amber-800 bg-amber-50 border-amber-200';
    } else {
      bioAssessment = 'Khó phân hủy sinh học, cần tăng cường oxy hóa bậc cao hoặc xử lý hóa lý (BOD/COD < 0.3)';
      bioColor = 'text-red-800 bg-red-50 border-red-200';
    }
  }

  return (
    <div className="max-w-[1240px] mx-auto px-4 py-6 pb-20 animate-fadeIn space-y-6">
      {/* Top back bar */}
      <div className="flex justify-start">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#cbd8d0] bg-[#f5f8f6] text-[#28573d] text-xs font-semibold hover:bg-[#eaf3ee] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>← Quay lại công cụ nước thải</span>
        </button>
      </div>

      {/* Heading with tab switcher */}
      <div className="bg-gradient-to-br from-[#f2f7f4] to-[#e7f0ea] border border-[#d3dfd7] rounded-2xl p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-extrabold text-[#193d2c]">Tải lượng</h1>
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-white text-[#176b45] border border-[#cbd8d0]">
              {projectType === 'Khác' ? otherWastewaterType || 'Nước thải khác' : projectType}
            </span>
          </div>
          <p className="text-xs text-[#5d7366] mt-0.5">
            Nhập các thông số nồng độ, lưu lượng và tính toán tải lượng ô nhiễm phục vụ thiết kế.
          </p>
        </div>

        {/* Segmented Tab Control */}
        <div className="flex items-center p-1 bg-[#dbe8df] rounded-xl border border-[#c8d8cd] shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('input')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'input'
                ? 'bg-white text-[#176b45] shadow-sm'
                : 'text-[#486354] hover:text-[#183a2a]'
            }`}
          >
            Đầu vào
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('results')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
              activeTab === 'results'
                ? 'bg-white text-[#176b45] shadow-sm'
                : 'text-[#486354] hover:text-[#183a2a]'
            }`}
          >
            <span>Kết quả tính toán</span>
            {validationErrors.length > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-500" />
            )}
          </button>
        </div>
      </div>

      {/* Validation warning if errors exist */}
      {validationErrors.length > 0 && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600 mt-0.5" />
          <div>
            <span className="font-bold">Cần kiểm tra lại thông số: </span>
            <span>{validationErrors.join('; ')}</span>
          </div>
        </div>
      )}

      {/* TAB 1: ĐẦU VÀO */}
      {activeTab === 'input' && (
        <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-[#e5eee8] bg-[#fbfdfb] flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-[#183b2b]">Thông số đầu vào nguồn nước thải</h2>
              <p className="text-xs text-[#63776d]">
                Dữ liệu do chủ đầu tư cung cấp hoặc khảo sát đo đạc thực tế
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab('results')}
              className="px-3.5 py-1.5 rounded-lg bg-[#176b45] text-white text-xs font-semibold hover:bg-[#105a39] transition-colors"
            >
              Xem kết quả tính toán →
            </button>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* Loại nước thải */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">Loại nước thải</label>
                <select
                  value={projectType}
                  onChange={(e) => onUpdateProjectType(e.target.value, otherWastewaterType)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-medium"
                >
                  <option value="Sinh hoạt">Sinh hoạt</option>
                  <option value="Sản xuất thực phẩm">Sản xuất thực phẩm</option>
                  <option value="Bệnh viện">Bệnh viện & Y tế</option>
                  <option value="Nước cấp / RO">Nước cấp / Xả thải RO</option>
                  <option value="Khác">Khác (tùy biến)</option>
                </select>
              </div>

              {/* Tên loại nước thải nếu chọn khác */}
              {projectType === 'Khác' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-[#234333]">
                    Tên loại nước thải cụ thể
                  </label>
                  <input
                    type="text"
                    value={otherWastewaterType || ''}
                    onChange={(e) => onUpdateProjectType('Khác', e.target.value)}
                    placeholder="VD: Dệt nhuộm, Thuộc da, Xi mạ..."
                    className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20"
                  />
                </div>
              )}

              {/* pH */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  pH đầu vào (0 – 14)
                </label>
                <NumericInput
                  min={0}
                  max={14}
                  step="0.1"
                  value={inputs.ph}
                  allowNull={true}
                  onChange={(val) => onUpdateInput('ph', val)}
                  onNullChange={(val) => onUpdateInput('ph', val)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
              </div>

              {/* Lưu lượng trung bình ngày Qtb */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  Lưu lượng trung bình Q<sub>tb</sub> (m³/ngày)
                </label>
                <NumericInput
                  min={0}
                  value={inputs.qavg}
                  allowNull={true}
                  onChange={(val) => onUpdateInput('qavg', val)}
                  onNullChange={(val) => onUpdateInput('qavg', val)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
              </div>

              {/* Hệ số không điều hòa K */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  Hệ số không điều hòa K (—)
                </label>
                <NumericInput
                  min={1}
                  step="0.05"
                  value={inputs.kpeak}
                  allowNull={true}
                  onChange={(val) => onUpdateInput('kpeak', val)}
                  onNullChange={(val) => onUpdateInput('kpeak', val)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
                <span className="text-[10px] text-[#718579] block">
                  K thường dao động từ 1.5 – 3.0 tùy quy mô trạm
                </span>
              </div>

              {/* Thời gian hoạt động */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  Thời gian hoạt động (giờ/ngày)
                </label>
                <NumericInput
                  min={1}
                  max={24}
                  step="0.5"
                  value={inputs.hours}
                  allowNull={true}
                  onChange={(val) => onUpdateInput('hours', val)}
                  onNullChange={(val) => onUpdateInput('hours', val)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
              </div>

              {/* Q thiết kế nhập riêng */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#3a5245]">
                  Q thiết kế nhập riêng (m³/ngày)
                </label>
                <NumericInput
                  min={0}
                  placeholder="Để trống nếu lấy theo Qtb"
                  value={inputs.qmanual}
                  allowNull={true}
                  onChange={(val) => onUpdateInput('qmanual', val)}
                  onNullChange={(val) => onUpdateInput('qmanual', val)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20"
                />
              </div>

              {/* BOD5 */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  BOD₅ đầu vào (mg/L)
                </label>
                <NumericInput
                  min={0}
                  value={inputs.bod}
                  allowNull={true}
                  onChange={(val) => onUpdateInput('bod', val)}
                  onNullChange={(val) => onUpdateInput('bod', val)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
              </div>

              {/* COD */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  COD đầu vào (mg/L)
                </label>
                <NumericInput
                  min={0}
                  value={inputs.cod}
                  allowNull={true}
                  onChange={(val) => onUpdateInput('cod', val)}
                  onNullChange={(val) => onUpdateInput('cod', val)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
              </div>

              {/* TSS */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  TSS đầu vào (mg/L)
                </label>
                <NumericInput
                  min={0}
                  value={inputs.tss}
                  allowNull={true}
                  onChange={(val) => onUpdateInput('tss', val)}
                  onNullChange={(val) => onUpdateInput('tss', val)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
              </div>

              {/* Tổng Nitơ */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  Tổng Nitơ (TN) (mg/L)
                </label>
                <NumericInput
                  min={0}
                  value={inputs.tn}
                  allowNull={true}
                  onChange={(val) => onUpdateInput('tn', val)}
                  onNullChange={(val) => onUpdateInput('tn', val)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
              </div>

              {/* Amoni NH4 */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  Amoni (NH₄-N) (mg/L)
                </label>
                <NumericInput
                  min={0}
                  value={inputs.nh4}
                  allowNull={true}
                  onChange={(val) => onUpdateInput('nh4', val)}
                  onNullChange={(val) => onUpdateInput('nh4', val)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
              </div>

              {/* Tổng Phốt pho */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  Tổng Phốt pho (TP) (mg/L)
                </label>
                <NumericInput
                  min={0}
                  value={inputs.tp}
                  allowNull={true}
                  onChange={(val) => onUpdateInput('tp', val)}
                  onNullChange={(val) => onUpdateInput('tp', val)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
              </div>

              {/* Độ kiềm */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-[#234333]">
                  Độ kiềm tổng (mg/L CaCO₃)
                </label>
                <NumericInput
                  min={0}
                  value={inputs.alkalinity}
                  allowNull={true}
                  onChange={(val) => onUpdateInput('alkalinity', val)}
                  onNullChange={(val) => onUpdateInput('alkalinity', val)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20 font-semibold"
                />
              </div>

              {/* Dầu mỡ */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#3a5245]">
                  Dầu mỡ khoáng/động thực vật (mg/L)
                </label>
                <NumericInput
                  min={0}
                  value={inputs.oilgrease}
                  allowNull={true}
                  onChange={(val) => onUpdateInput('oilgrease', val)}
                  onNullChange={(val) => onUpdateInput('oilgrease', val)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20"
                />
              </div>

              {/* Nhiệt độ */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-[#3a5245]">
                  Nhiệt độ nước thải (°C)
                </label>
                <NumericInput
                  min={0}
                  max={100}
                  value={inputs.temperature}
                  allowNull={true}
                  onChange={(val) => onUpdateInput('temperature', val)}
                  onNullChange={(val) => onUpdateInput('temperature', val)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#cbd8d0] text-xs text-[#183929] bg-white focus:border-[#176b45] focus:ring-2 focus:ring-[#176b45]/20"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KẾT QUẢ TÍNH TOÁN */}
      {activeTab === 'results' && (
        <div className="space-y-6">
          {/* 4 Core Summary Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-[#d3dfd7] shadow-xs">
              <div className="text-[11px] font-semibold text-[#667a6e]">Lưu lượng thiết kế Q</div>
              <div className="text-2xl font-extrabold text-[#173827] mt-1 tabular-nums">
                {formatNumber(results.q)}
              </div>
              <div className="text-[11px] text-[#176b45] font-semibold mt-0.5">m³/ngày</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#d3dfd7] shadow-xs">
              <div className="text-[11px] font-semibold text-[#667a6e]">Lưu lượng giờ đỉnh Q<sub>h</sub></div>
              <div className="text-2xl font-extrabold text-[#173827] mt-1 tabular-nums">
                {formatNumber(results.qh)}
              </div>
              <div className="text-[11px] text-[#176b45] font-semibold mt-0.5">m³/giờ</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#d3dfd7] shadow-xs">
              <div className="text-[11px] font-semibold text-[#667a6e]">Tải lượng BOD₅</div>
              <div className="text-2xl font-extrabold text-[#173827] mt-1 tabular-nums">
                {formatNumber(results.loads.bod)}
              </div>
              <div className="text-[11px] text-[#176b45] font-semibold mt-0.5">kg/ngày</div>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-[#d3dfd7] shadow-xs">
              <div className="text-[11px] font-semibold text-[#667a6e]">Tải lượng COD</div>
              <div className="text-2xl font-extrabold text-[#173827] mt-1 tabular-nums">
                {formatNumber(results.loads.cod)}
              </div>
              <div className="text-[11px] text-[#176b45] font-semibold mt-0.5">kg/ngày</div>
            </div>
          </div>

          {/* Biological assessment banner */}
          <div className={`p-4 rounded-2xl border text-xs font-semibold flex items-center gap-3 ${bioColor}`}>
            <Sparkles className="w-5 h-5 shrink-0" />
            <div>
              <div className="font-bold">Đánh giá tỷ số BOD₅/COD = {formatNumber(results.bodCodRatio)}</div>
              <div className="font-normal mt-0.5">{bioAssessment}</div>
            </div>
          </div>



          {/* Detailed Calculation Results Table */}
          <div className="bg-white border border-[#cfded4] rounded-2xl shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-[#e5eee8] bg-[#fbfdfb] flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#183b2b]">Bảng chi tiết thông số và tải lượng</h2>
                <p className="text-xs text-[#63776d]">
                  Kết quả tính theo công thức SI chuẩn: Tải lượng = Q × C ÷ 1.000
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#e8f3ec] text-[#176b45]">
                Đã cập nhật
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#f3f7f4] border-b border-[#e2ece5] text-[#4d6356] font-bold">
                    <th className="py-3 px-5">Thông số kỹ thuật</th>
                    <th className="py-3 px-5 text-right">Kết quả tính toán</th>
                    <th className="py-3 px-5 text-right">Đơn vị</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#edf3ef] text-[#20362b]">
                  <tr className="hover:bg-[#fbfdfc]">
                    <td className="py-3 px-5 font-semibold text-[#176b45]">Lưu lượng ngày thiết kế Q</td>
                    <td className="py-3 px-5 text-right font-bold tabular-nums">{formatNumber(results.q)}</td>
                    <td className="py-3 px-5 text-right text-[#728578]">m³/ngày</td>
                  </tr>
                  <tr className="hover:bg-[#fbfdfc]">
                    <td className="py-3 px-5">Lưu lượng giờ trung bình Q<sub>h</sub></td>
                    <td className="py-3 px-5 text-right font-bold tabular-nums">{formatNumber(results.qHour)}</td>
                    <td className="py-3 px-5 text-right text-[#728578]">m³/giờ</td>
                  </tr>
                  <tr className="hover:bg-[#fbfdfc]">
                    <td className="py-3 px-5">Lưu lượng phút trung bình Q<sub>min</sub></td>
                    <td className="py-3 px-5 text-right font-bold tabular-nums">{formatNumber(results.qMinute, 3)}</td>
                    <td className="py-3 px-5 text-right text-[#728578]">m³/phút</td>
                  </tr>
                  <tr className="hover:bg-[#fbfdfc]">
                    <td className="py-3 px-5 font-semibold text-[#176b45]">Lưu lượng giờ đỉnh Q<sub>maxh</sub></td>
                    <td className="py-3 px-5 text-right font-bold tabular-nums text-[#176b45]">{formatNumber(results.qh)}</td>
                    <td className="py-3 px-5 text-right text-[#728578]">m³/giờ</td>
                  </tr>
                  <tr className="hover:bg-[#fbfdfc]">
                    <td className="py-3 px-5">Lưu lượng phút đỉnh Q<sub>max-min</sub></td>
                    <td className="py-3 px-5 text-right font-bold tabular-nums">{formatNumber(results.qPeakMinute, 3)}</td>
                    <td className="py-3 px-5 text-right text-[#728578]">m³/phút</td>
                  </tr>
                  <tr className="hover:bg-[#fbfdfc]">
                    <td className="py-3 px-5">Tải lượng kiềm tiêu thụ / bổ sung</td>
                    <td className="py-3 px-5 text-right font-bold tabular-nums">{formatNumber(results.alkalinityLoad)}</td>
                    <td className="py-3 px-5 text-right text-[#728578]">kg CaCO₃/ngày</td>
                  </tr>
                  <tr className="hover:bg-[#fbfdfc]">
                    <td className="py-3 px-5 font-medium">Tỷ số BOD₅/COD</td>
                    <td className="py-3 px-5 text-right font-bold tabular-nums">{formatNumber(results.bodCodRatio)}</td>
                    <td className="py-3 px-5 text-right text-[#728578]">—</td>
                  </tr>

                  {/* Pollutant Loads */}
                  {POLLUTANTS.map((p) => {
                    const loadVal = (results.loads as any)[p.key];
                    return (
                      <tr key={p.key} className="hover:bg-[#fbfdfc]">
                        <td className="py-3 px-5 font-semibold">
                          Tải lượng {p.label}
                        </td>
                        <td className="py-3 px-5 text-right font-extrabold text-[#193d2c] tabular-nums">
                          {formatNumber(loadVal)}
                        </td>
                        <td className="py-3 px-5 text-right text-[#728578]">kg/ngày</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-6 py-3 border-t border-[#edf3ef] bg-[#fafcfb] text-[11px] text-[#6b7e73] leading-relaxed">
              Công thức: Tải lượng = Q × C ÷ 1.000. Lưu lượng giờ đỉnh Q<sub>maxh</sub> = Q × K ÷ thời gian hoạt động.
            </div>
          </div>


        </div>
      )}

      {/* Bottom action bar */}
      <div className="flex items-center justify-between pt-4 border-t border-[#d8e4dc]">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#cbd8d0] bg-[#f5f8f6] text-[#28573d] text-xs font-semibold hover:bg-[#eaf3ee] transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>← Quay lại công cụ nước thải</span>
        </button>

        {activeTab === 'input' ? (
          <button
            type="button"
            onClick={() => setActiveTab('results')}
            className="px-5 py-2.5 rounded-xl bg-[#176b45] text-white text-xs font-bold hover:bg-[#105a39] shadow-sm transition-all"
          >
            Xem kết quả tính toán →
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setActiveTab('input')}
            className="px-5 py-2.5 rounded-xl border border-[#c5d5cb] bg-white text-[#204030] text-xs font-semibold hover:bg-[#f3f8f5]"
          >
            Chỉnh sửa đầu vào
          </button>
        )}
      </div>
    </div>
  );
};
