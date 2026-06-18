from Decision_phase.rl.env import DecisionEnv
from Decision_phase.rl.trainer import DRQNTrainer
from Decision_phase.rl.state_builder import build_observation



def train(conjunctions, maneuvers, telemetry):

    action_space = [m["maneuver"] for m in maneuvers]
    input_dim = 11

    trainer = DRQNTrainer(input_dim, action_space)

    for epoch in range(50):
        print(f"\nEpoch {epoch}")

        for conj in conjunctions:

            env = DecisionEnv(conj, telemetry)
            env.set_maneuvers(maneuvers)

            episode = []

            # build observation
            obs = build_observation(conj, maneuvers[0], telemetry)

            # try each action once (exploration)
            for m in maneuvers:
                next_state, reward, done = env.step(m["maneuver"])

                next_obs = build_observation(next_state, m, telemetry)

                episode.append(
                    (obs, m["maneuver"], reward, next_obs, done)
                )

            trainer.store_episode(episode)

        trainer.train_step()

    # save model
    import torch
    print(">>> Saving DRQN model now...")
    torch.save(trainer.model.state_dict(), "drqn_trained.pt")
    print(">>> Model saved")

    # torch.save(trainer.model.state_dict(), "drqn_trained.pt")
