import { motion } from 'framer-motion';
import PenIcon from '../../assets/icons/pen.png';

const Welcome = ({ setSelectedContent }) => {
  
  return (
    <div className="min-h-screen px-6 py-10 bg-[#FFF0D1] text-[#3B3030]">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-4xl mx-auto text-center"
      >
        <div className="flex items-center justify-center gap-4 mt-12">
          <h1 className="text-3xl md:text-4xl font-extrabold">Welcome to Cold Emailer</h1>
          <img src={PenIcon} alt="Pen Icon" width={40} height={40} className="inline-block" />
        </div>

        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-lg md:text-2xl mb-4 font-bold pt-10"
        >
          Where your outreach transforms into opportunities!
        </motion.h3>

        <motion.h4
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-md font-semibold pt-8"
        >
          With Cold Emailer, you can:
        </motion.h4>

        <motion.ul
          initial="hidden"
          animate="visible"
          variants={{
            hidden: { opacity: 0 },
            visible: {
              opacity: 1,
              transition: {
                staggerChildren: 0.2,
              },
            },
          }}
          className="list-disc list-inside text-left max-w-md mx-auto mb-6 space-y-2 pb-8"
        >
          <motion.li variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
            Craft irresistible emails with ease.
          </motion.li>
          <motion.li variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
            Organize your emails effortlessly.
          </motion.li>
          <motion.li variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }}>
            Organize recipients and categories with ease.
          </motion.li>
        </motion.ul>

        <motion.h3
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-lg md:text-xl mb-6 font-bold"
        >
          Here’s to turning every email into a success story!
        </motion.h3>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setSelectedContent('create-email')}
          className="bg-[#795757] text-[#FFF0D1] px-6 py-3 rounded-xl font-semibold shadow hover:bg-[#6a4949] transition"
        >
          Get Started
        </motion.button>
      </motion.div>
    </div>
  );
};

export default Welcome;
