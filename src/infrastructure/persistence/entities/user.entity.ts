import { Entity, PrimaryColumn, Column } from 'typeorm';

@Entity('users')
export class UserEntity {
  @PrimaryColumn('uuid')
  id: string;

  @Column({ type: 'text', nullable: false, unique: true })
  email: string;

  @Column({ type: 'text', nullable: false, name: 'password_hash' })
  password_hash: string;

  @Column({ type: 'timestamptz', nullable: false, name: 'created_at' })
  created_at: Date;

  @Column({ type: 'timestamptz', nullable: false, name: 'updated_at' })
  updated_at: Date;
}
