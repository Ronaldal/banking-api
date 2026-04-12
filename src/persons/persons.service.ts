import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Person } from '../entities/person.entity';

@Injectable()
export class PersonsService implements OnModuleInit {
  private readonly logger = new Logger(PersonsService.name);

  constructor(
    @InjectRepository(Person)
    private readonly personRepository: Repository<Person>,
  ) {}

  async onModuleInit() {
    const count = await this.personRepository.count();

    if (count === 0) {
      const defaultPerson = this.personRepository.create({
        name: 'John Doe',
        document: '123456789',
        birthDate: new Date('1990-01-01'),
      });

      await this.personRepository.save(defaultPerson);
      this.logger.log(
        `Created default person with ID: ${defaultPerson.personId}`,
      );
    } else {
      this.logger.log('Persons table already has data. Skipping seed.');
    }
  }
}
