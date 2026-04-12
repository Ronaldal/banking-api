import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { PersonsService } from './persons.service';
import { Person } from '../entities/person.entity';

describe('PersonsService', () => {
  let service: PersonsService;

  const mockPersonRepository = {
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PersonsService,
        { provide: getRepositoryToken(Person), useValue: mockPersonRepository },
      ],
    }).compile();

    service = module.get<PersonsService>(PersonsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('onModuleInit', () => {
    it('should seed a default person when table is empty', async () => {
      const defaultPerson = { personId: 1, name: 'John Doe', document: '123456789' };

      mockPersonRepository.count.mockResolvedValue(0);
      mockPersonRepository.create.mockReturnValue(defaultPerson);
      mockPersonRepository.save.mockResolvedValue(defaultPerson);

      await service.onModuleInit();

      expect(mockPersonRepository.count).toHaveBeenCalled();
      expect(mockPersonRepository.create).toHaveBeenCalledWith({
        name: 'John Doe',
        document: '123456789',
        birthDate: new Date('1990-01-01'),
      });
      expect(mockPersonRepository.save).toHaveBeenCalledWith(defaultPerson);
    });

    it('should skip seeding when table already has data', async () => {
      mockPersonRepository.count.mockResolvedValue(3);

      await service.onModuleInit();

      expect(mockPersonRepository.count).toHaveBeenCalled();
      expect(mockPersonRepository.create).not.toHaveBeenCalled();
      expect(mockPersonRepository.save).not.toHaveBeenCalled();
    });
  });
});
