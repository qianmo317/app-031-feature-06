// 锯路/修边参数解析：整单一整套 + 每种板可各自覆盖。
// 所有排版、刀路、统计、打印都从这里取生效值，保证改一处后各处用同一套参数得出同一个结论。
import type { Board, Job, SheetResult } from '../types'

/** 毫米数值统一保留 1 位小数 */
export function round1(v: number): number {
  return Math.round(v * 10) / 10
}

/** 板材生效锯路：板级未填时跟随整单 */
export function boardKerf(board: Board, job: Job): number {
  return board.kerfMm ?? job.kerfMm
}

/** 板材生效修边：板级未填时跟随整单 */
export function boardTrim(board: Board, job: Job): number {
  return board.trimMm ?? job.trimMm
}

/** 已排出板子的锯路快照；老项目结果缺字段时回落整单值 */
export function sheetKerf(sheet: SheetResult, job: Job): number {
  return sheet.kerfMm ?? job.kerfMm
}

/** 已排出板子的修边快照；老项目结果缺字段时回落整单值 */
export function sheetTrim(sheet: SheetResult, job: Job): number {
  return sheet.trimMm ?? job.trimMm
}

export interface BoardParamSet {
  kerf: number
  trim: number
  names: string[] // 使用该套参数的板材名称
}

/** 整单各板种生效参数去重分组（按板材库顺序），用于「各板种参数不一致」提示。 */
export function distinctBoardParams(job: Job): BoardParamSet[] {
  const out: BoardParamSet[] = []
  for (const b of job.boards) {
    const kerf = boardKerf(b, job)
    const trim = boardTrim(b, job)
    const hit = out.find((s) => s.kerf === kerf && s.trim === trim)
    if (hit) hit.names.push(b.name)
    else out.push({ kerf, trim, names: [b.name] })
  }
  return out
}

/** 两种取值是否「差太多」：锯路相差 ≥1mm 或修边相差 ≥2mm。 */
export function paramsDiverge(a: { kerf: number; trim: number }, b: { kerf: number; trim: number }): boolean {
  return Math.abs(a.kerf - b.kerf) >= 1 - 1e-9 || Math.abs(a.trim - b.trim) >= 2 - 1e-9
}
