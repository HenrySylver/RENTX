import { parse as csvParse } from "csv-parse";
import fs from "fs";

import { ISpecificationsRepository } from "../../repositories/ISpecificationsRepository";
import { IImportSpecificationsDTO } from "../../shared/utils/dtos/IImportSpecificationsDTO";

class ImportSpecificationsUseCase {
  constructor(private SpecificationsRepository: ISpecificationsRepository) {}

  loadSpecifications(
    file: Express.Multer.File
  ): Promise<IImportSpecificationsDTO[]> {
    return new Promise((resolve, reject) => {
      const stream = fs.createReadStream(file.path);
      const specifications: IImportSpecificationsDTO[] = [];

      const parseFile = csvParse({ delimiter: ";" });

      stream.pipe(parseFile);

      parseFile
        .on("data", async (line) => {
          const [name, description] = line;
          specifications.push({
            name,
            description,
          });
        })
        .on("end", () => {
          fs.promises.unlink(file.path);
          resolve(specifications);
        })
        .on("error", (err) => {
          reject(err);
        });
    });
  }

  async execute(file: Express.Multer.File): Promise<void> {
    const specifications = await this.loadSpecifications(file);

    specifications.map(async (Specifications) => {
      const { name, description } = Specifications;

      const existSpecifications =
        await this.SpecificationsRepository.findByName(name);

      if (!existSpecifications) {
        await this.SpecificationsRepository.create({
          name,
          description,
        });
      }
    });
  }
}

export { ImportSpecificationsUseCase };
