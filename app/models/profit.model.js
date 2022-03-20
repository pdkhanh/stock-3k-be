module.exports = mongoose => {
  var schema = mongoose.Schema(
    {
      code: String,
      addedDate: String,
      initPrice: Number,
      price: Number,
      change: Number,
      perChange: Number,
      profit: Number,
      profitPercent: Number,
      filter: String
    },
    { timestamps: true },
  );

  schema.method("toJSON", function () {
    const { __v, _id, ...object } = this.toObject();
    object.id = _id;
    return object;
  });

  const Profit = mongoose.model("Profit", schema, 'Profit');
  return Profit;
};