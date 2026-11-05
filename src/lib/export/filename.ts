import type { TemplateId } from '../templates/types';

/**
 * Download file name: `quietqr-<template>.<ext>`. Never derived from the content, so SSIDs
 * or names don't leak into download folders or sync services.
 */
export function exportFilename(template: TemplateId, ext: 'svg' | 'png'): string {
  return `quietqr-${template}.${ext}`;
}
