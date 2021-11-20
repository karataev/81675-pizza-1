import ordersService from "@/services/ordersService";

export default {
  namespaced: true,
  state: {
    orders: [],
    userPhone: "",
    address: {
      street: "",
      building: "",
      flat: "",
      comment: "",
    },
  },
  mutations: {
    setState(state, newState) {
      Object.assign(state, newState);
    },
  },
  actions: {
    async getOrders({ commit, rootState, rootGetters }) {
      const doughById = rootGetters["Public/doughById"];
      const sauceById = rootGetters["Public/sauceById"];
      const sizeById = rootGetters["Public/sizeById"];
      const ingredientById = rootGetters["Public/ingredientById"];
      const miscById = (id) =>
        rootState.Cart.additional.find((item) => item.id === id);

      const orders = await ordersService.getAll();
      const normalizedOrders = orders.map((order) => {
        const pizzas = order.orderPizzas.map((orderPizza) => {
          return {
            name: orderPizza.name,
            amount: orderPizza.quantity,
            dough: doughById(orderPizza.doughId),
            sauce: sauceById(orderPizza.sauceId),
            size: sizeById(orderPizza.sizeId),
            ingredients: orderPizza.ingredients.map((item) => {
              return {
                ...ingredientById(item.ingredientId),
                amount: item.quantity,
              };
            }),
          };
        });

        const misc =
          order.orderMisc?.map((orderMisc) => {
            return {
              ...miscById(orderMisc.miscId),
              amount: orderMisc.quantity,
            };
          }) ?? [];

        return {
          id: order.id,
          orderAddress: order.orderAddress,
          orderPizzas: pizzas,
          orderMisc: misc,
          phone: order.phone,
          userId: order.userId,
        };
      });
      commit("setState", { orders: normalizedOrders });
    },
    async createOrder({ rootGetters, dispatch }, orderData) {
      const pizzas = orderData.pizzas.map((item) => {
        return {
          name: item.name,
          sauceId: item.sauce.id,
          doughId: item.dough.id,
          sizeId: item.size.id,
          quantity: item.amount,
          ingredients: item.ingredients.map((ingredient) => {
            return {
              ingredientId: ingredient.id,
              quantity: ingredient.amount,
            };
          }),
        };
      });
      const misc = orderData.misc
        .filter((item) => item.amount > 0)
        .map((item) => {
          return {
            miscId: item.id,
            quantity: item.amount,
          };
        });
      const order = {
        userId: orderData.userId,
        phone: orderData.phone,
        pizzas,
        misc,
        address: orderData.address,
      };

      try {
        await ordersService.create(order);
        if (rootGetters["Auth/isAuthed"]) {
          dispatch("getOrders");
        }
      } catch (e) {
        console.log(e);
      }
    },
    async removeOrder({ rootGetters, dispatch }, id) {
      try {
        await ordersService.remove(id);
        if (rootGetters["Auth/isAuthed"]) {
          dispatch("getOrders");
        }
      } catch (e) {
        console.log(e);
      }
    },
  },
};
