import * as Genetic from "@glavin001/genetic-js";

import { raw } from "./raw-serializer";
import { UnibeautifyGenetic, UserData, Entity } from "../src/index";

export function testGenetic(title: string, userData: UserData, skip?: true) {
  const configuration: Partial<Genetic.Configuration> = {
    fittestAlwaysSurvives: true,
    iterations: 200,
    size: 50,
    crossover: 0.8,
    mutation: 0.5,
    skip: 100,
  };
  (skip ? test.skip : test)(title, done => {
    expect.hasAssertions();
    const genetic = new UnibeautifyGenetic({
      configuration,
      userData,
    });
    genetic.notification = function(
      this: UnibeautifyGenetic,
      { population, isFinished }: Genetic.Notification<Entity>
    ) {
      if (isFinished) {
        this.beautify(this.originalText, population[0].entity).then(
          (beautifiedText: string) => {
            const entity = population[0].entity;
            const { options } = entity;
            expect(raw(beautifiedText)).toMatchSnapshot("beautifiedText");
            // expect(population[0].entity).toMatchSnapshot("entity");
            // expect(population[0].fitness).toMatchSnapshot("fitness");
            expect((options as any).beautifiers).toMatchSnapshot("beautifiers");
            this.trimOptions(options).then(trimmedOptions => {
              expect(trimmedOptions).toMatchSnapshot("trimmedOptions");
              done();
            });
          }
        );
      }
    };
    return genetic.evolve().catch(error => {
      console.error(error);
      done();
    });
  });
}
