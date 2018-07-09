import * as Genetic from "@glavin001/genetic-js";

type Entity = string;
interface UserData {
  solution: Entity;
}
// const genetic = Genetic.create<Entity, UserData>();
class PhraseGenetic extends Genetic.Genetic<Entity, UserData> {
  optimize = Genetic.Optimize.Maximize;
  select1 = Genetic.Select1.Tournament2;
  select2 = Genetic.Select2.Tournament2;

  seed() {
    function randomString(len: number) {
      let text = "";
      const charset = "abcdefghijklmnopqrstuvwxyz0123456789";
      for (var i = 0; i < len; i++)
        text += charset.charAt(Math.floor(Math.random() * charset.length));

      return text;
    }

    // create random strings that are equal in length to solution
    return randomString(this.userData["solution"].length);
  }

  mutate(entity: Entity) {
    function replaceAt(str: string, index: number, character: string) {
      return (
        str.substr(0, index) + character + str.substr(index + character.length)
      );
    }

    // chromosomal drift
    var i = Math.floor(Math.random() * entity.length);
    return replaceAt(
      entity,
      i,
      String.fromCharCode(
        entity.charCodeAt(i) + (Math.floor(Math.random() * 2) ? 1 : -1)
      )
    );
  }

  crossover(mother: Entity, father: Entity): [Entity, Entity] {
    // two-point crossover
    var len = mother.length;
    var ca = Math.floor(Math.random() * len);
    var cb = Math.floor(Math.random() * len);
    if (ca > cb) {
      var tmp = cb;
      cb = ca;
      ca = tmp;
    }

    var son =
      father.substr(0, ca) + mother.substr(ca, cb - ca) + father.substr(cb);
    var daughter =
      mother.substr(0, ca) + father.substr(ca, cb - ca) + mother.substr(cb);

    return [son, daughter];
  }

  fitness(entity: Entity) {
    var fitness = 0;

    var i;
    for (i = 0; i < entity.length; ++i) {
      // increase fitness for each character that matches
      if (entity[i] == this.userData["solution"][i]) fitness += 1;

      // award fractions of a point as we get warmer
      fitness +=
        (127 -
          Math.abs(
            entity.charCodeAt(i) - this.userData["solution"].charCodeAt(i)
          )) /
        50;
    }
    return fitness;
    // return new Promise(function(resolve, reject) {
    //   setTimeout(resolve.bind(null, fitness), 100);
    // });
  }

  shouldContinue({ population: pop }: Genetic.GeneticState<Entity>) {
    // stop running once we've reached the solution
    return pop[0].entity != this.userData["solution"];
  }

  notification({
    population,
    isFinished,
    generation,
    stats,
  }: Genetic.Notification<Entity>) {
    if (isFinished) {
      console.log(
        JSON.stringify({ solution: population[0], generation, stats }, null, 2)
      );
    }
  }
}

const config: Partial<Genetic.Configuration> = {
  iterations: 4000,
  size: 250,
  crossover: 0.3,
  mutation: 0.3,
  skip: 20,
};

const userData: UserData = {
  solution:
    "Insanity is doing the same thing over and over again and expecting different results",
};
const genetic = new PhraseGenetic(config, userData);
genetic.evolve();
