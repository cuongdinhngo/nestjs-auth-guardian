import { Column } from 'typeorm';
import { Exclude } from 'class-transformer';

/**
 * Decorator to add MFA columns to a TypeORM entity
 * Usage:
 * @Entity('users')
 * @MfaEntity()
 * export class User { ... }
 */
export function MfaEntity(): ClassDecorator {
  return (target: Function) => {
    Column({ type: 'boolean', default: false })(target.prototype, 'mfaEnabled');

    Exclude()(target.prototype, 'mfaSecret');
    Column({ type: 'varchar', nullable: true, select: false })(target.prototype, 'mfaSecret');

    Exclude()(target.prototype, 'mfaBackupCodes');
    Column({ type: 'simple-array', nullable: true, select: false })(
      target.prototype,
      'mfaBackupCodes',
    );
  };
}
