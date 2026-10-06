// 锯路/修边参数的唯一解析入口：
// - 整单有一套缺省值（job.kerfMm / job.trimMm）
// - 每种板可在自己那一行填 kerfMm/trimMm；填了用板自己的，没填跟整单
// - 所有数值一律按毫米保留一位小数
// 排样、刀路、模拟、微调、统计、打印取参数都必须走这里，禁止各处各算一套。
import type { Board, Job, SheetResult } from '../types'

export interface BoardParams {
  kerf: number
  trim: number
}

/** 同一张板上不同板种的件能否拼在一起：锯路或修边差太多即判为不兼容。 */
export const KERF_DIFF_LIMIT_MM = 1.0
export const TRIM_DIFF_LIMIT_MM = 3.0

/** 毫米保留一位小数。 */
export function mm1(v: number): number {
  return Math.round(v * 10) / 10
}

function finitePositive(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v > 0
}
function finiteNonNegative(v: unknown): v is number {
  return typeof v === 'number' && Number.isFinite(v) && v >= 0
}

/** 整单缺省值（同样保留一位小数）。 */
export function jobParams(job: Job): BoardParams {
  return { kerf: mm1(job.kerfMm), trim: mm1(job.trimMm) }
}

/**
 * 某种板实际生效的锯路/修边：
 * 板上显式填了合法值就用板的，否则跟整单。
 * 注意：改整单值时只有「没填」的板会跟着变——填过的板在此处即被短路。
 */
export function effectiveBoardParams(board: Board, job: Job): BoardParams {
  return {
    kerf: mm1(finitePositive(board.kerfMm) ? board.kerfMm : job.kerfMm),
    trim: mm1(finiteNonNegative(board.trimMm) ? board.trimMm : job.trimMm)
  }
}

/** 该板是否显式覆盖了整单值（UI 用来标「跟整单」）。 */
export function boardOverrides(board: Board): { kerf: boolean; trim: boolean } {
  return {
    kerf: finitePositive(board.kerfMm),
    trim: finiteNonNegative(board.trimMm)
  }
}

/** 一张已排出的板实际用的参数；兼容旧版本结果（旧结果上没有逐板字段）。 */
export function sheetParams(sheet: SheetResult, job: Job): BoardParams {
  return {
    kerf: mm1(finitePositive(sheet.kerfMm) ? (sheet.kerfMm as number) : job.kerfMm),
    trim: mm1(finiteNonNegative(sheet.trimMm) ? (sheet.trimMm as number) : job.trimMm)
  }
}

export function paramsDiff(a: BoardParams, b: BoardParams): { kerf: number; trim: number } {
  return { kerf: mm1(Math.abs(a.kerf - b.kerf)), trim: mm1(Math.abs(a.trim - b.trim)) }
}

/** 两套取值是否「差太多」（锯路差 >1mm 或修边差 >3mm）。 */
export function paramsTooDifferent(a: BoardParams, b: BoardParams): boolean {
  const d = paramsDiff(a, b)
  return d.kerf > KERF_DIFF_LIMIT_MM + 1e-9 || d.trim > TRIM_DIFF_LIMIT_MM + 1e-9
}
