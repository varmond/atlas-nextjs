import { UOM } from "@prisma/client"
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const parseColor = (color: string) => {
  const hex = color.startsWith("#") ? color.slice(1) : color
  return parseInt(hex, 16)
}

export const getUOMLabel = (uom: UOM): string => {
  switch (uom) {
    case UOM.BOX:
      return "Box(es)"
    case UOM.VIAL:
      return "Vial(s)"
    case UOM.CARTON:
      return "Carton(s)"
    case UOM.UNIT:
      return "Unit(s)"
    case UOM.ML:
      return "Milliliter(s)"
    case UOM.MG:
      return "Milligram(s)"
    case UOM.G:
      return "Gram(s)"
    case UOM.KG:
      return "Kilogram(s)"
    case UOM.L:
      return "Liter(s)"
    case UOM.TABLET:
      return "Tablet(s)"
    case UOM.CAPSULE:
      return "Capsule(s)"
    case UOM.BOTTLE:
      return "Bottle(s)"
    case UOM.PACK:
      return "Pack(s)"
    case UOM.CASE:
      return "Case(s)"
    case UOM.EA:
      return "Each"
    case UOM.DOSE:
      return "Dose(s)"
    case UOM.AMPULE:
      return "Ampule(s)"
    case UOM.PREFILLED:
      return "Prefilled Syringe(s)"
    case UOM.KIT:
      return "Kit(s)"
    default:
      return uom
  }
}
