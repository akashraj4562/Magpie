import { Module } from '@medusajs/framework/utils';
import MagpieModuleService from './service';

export const MAGPIE_MODULE = 'magpie';

export default Module(MAGPIE_MODULE, {
  service: MagpieModuleService,
});
