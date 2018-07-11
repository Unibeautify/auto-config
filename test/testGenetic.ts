import * as Genetic from "@glavin001/genetic-js";

import { raw } from "./raw-serializer";
import { UnibeautifyGenetic, UserData, Entity } from "../src/index";

export function testGenetic(title: string, userData: UserData, skip?: true) {
  const configuration: Partial<Genetic.Configuration> = {
    fittestAlwaysSurvives: true,
    iterations: 500,
    size: 20,
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
    genetic.notification = function({
      population,
      isFinished,
    }: Genetic.Notification<Entity>) {
      if (isFinished) {
        this.beautify(population[0].entity).then((beautifiedText: string) => {
          expect(raw(beautifiedText)).toMatchSnapshot("beautifiedText");
          expect(population[0].entity).toMatchSnapshot("entity");
          expect(population[0].fitness).toMatchSnapshot("fitness");
          done();
        });
      }
    };
    return genetic.evolve().catch(error => {
      console.error(error);
      done();
    });
  });
}
